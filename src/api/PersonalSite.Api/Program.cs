using Azure.Communication.Email;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalSite.Application.Interfaces;
using PersonalSite.Application.UseCases.Contact;
using PersonalSite.Infrastructure.Persistence;
using PersonalSite.Infrastructure.Repositories;
using PersonalSite.Infrastructure.Services;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not configured.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// ─── Hangfire ─────────────────────────────────────────────────────────────────
// Hangfire tables are created automatically by UseSqlServerStorage on first run.
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout       = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout   = TimeSpan.FromMinutes(5),
        QueuePollInterval            = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks           = true,
    }));
builder.Services.AddHangfireServer();

// ─── Authentication (JWT Bearer) ─────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    builder.Configuration["Jwt:Key"]
                        ?? throw new InvalidOperationException("Jwt:Key not configured."))),
        };
    });

// ─── CORS ─────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:4321", "http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
// "contact" policy: 3 requests per IP per hour (sliding window).
builder.Services.AddRateLimiter(opts =>
{
    opts.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Rate limit exceeded.", detail = "Too many requests. Try again later." },
            token);
    };

    opts.AddPolicy("contact", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit         = 3,
                Window              = TimeSpan.FromHours(1),
                SegmentsPerWindow   = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit          = 0,
            }));
});

// ─── Application Services ─────────────────────────────────────────────────────
builder.Services.AddScoped<IContactRepository, ContactRepository>();
builder.Services.AddScoped<SubmitContactFormHandler>();

// Azure Communication Services — email
var acsConnectionString = builder.Configuration["Acs:ConnectionString"];
if (!string.IsNullOrWhiteSpace(acsConnectionString))
{
    builder.Services.AddSingleton(new EmailClient(acsConnectionString));
    builder.Services.AddSingleton<IEmailService>(sp => new EmailService(
        client:        sp.GetRequiredService<EmailClient>(),
        senderAddress: builder.Configuration["Acs:SenderAddress"]
                           ?? throw new InvalidOperationException("Acs:SenderAddress not configured."),
        ownerAddress:  builder.Configuration["Acs:OwnerAddress"]
                           ?? throw new InvalidOperationException("Acs:OwnerAddress not configured.")));
}
else
{
    // Development stub — logs to console, does not send real emails.
    builder.Services.AddSingleton<IEmailService, NoOpEmailService>();
}

// ─── MVC / API ────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddSignalR();

// Swagger — development only
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ─── Build ───────────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    // Dashboard accessible only in development; restrict via auth in production.
    Authorization = [],
});

app.MapControllers();

app.Run();

// ─── Development stubs ──────────────────────────────────────────────────────

/// <summary>
/// No-op email service for local development (ACS not configured).
/// Prints notification content to the console instead of sending an email.
/// </summary>
internal sealed class NoOpEmailService : IEmailService
{
    public Task SendOwnerNotificationAsync(
        string subject, string textBody, string htmlBody,
        CancellationToken cancellationToken = default)
    {
        Console.WriteLine($"[NoOpEmailService] Subject: {subject}");
        Console.WriteLine($"[NoOpEmailService] Body: {textBody}");
        return Task.CompletedTask;
    }
}
