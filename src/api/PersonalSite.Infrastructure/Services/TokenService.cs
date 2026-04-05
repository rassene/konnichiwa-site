using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PersonalSite.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PersonalSite.Infrastructure.Services;

/// <summary>
/// Issues and validates JWTs for subscribers (30-day) and the owner (15-minute).
/// Key, issuer, and audience are read from <c>Jwt:Key</c>, <c>Jwt:Issuer</c>,
/// <c>Jwt:Audience</c> in configuration — same values used by JWT bearer middleware.
/// </summary>
public sealed class TokenService : ITokenService
{
    private readonly SymmetricSecurityKey _key;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly JwtSecurityTokenHandler _handler = new();

    public TokenService(IConfiguration config)
    {
        var keyStr  = config["Jwt:Key"]      ?? throw new InvalidOperationException("Jwt:Key not configured.");
        _issuer     = config["Jwt:Issuer"]   ?? throw new InvalidOperationException("Jwt:Issuer not configured.");
        _audience   = config["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience not configured.");
        _key        = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
    }

    /// <inheritdoc />
    public string IssueSubscriberToken(Guid subscriberId, string[] clusters)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,  subscriberId.ToString()),
            new(ClaimTypes.Role,              "subscriber"),
            new("clusters",                   string.Join(",", clusters)),
        };

        return BuildToken(claims, TimeSpan.FromDays(30));
    }

    /// <inheritdoc />
    public string IssueOwnerToken()
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "owner"),
            new(ClaimTypes.Role,             "owner"),
        };

        return BuildToken(claims, TimeSpan.FromMinutes(15));
    }

    /// <inheritdoc />
    public TokenClaims? ValidateToken(string token)
    {
        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = _issuer,
            ValidAudience            = _audience,
            IssuerSigningKey         = _key,
            ClockSkew                = TimeSpan.FromSeconds(30),
        };

        try
        {
            var principal = _handler.ValidateToken(token, validationParams, out var validated);
            var jwt       = (JwtSecurityToken)validated;

            var sub  = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? string.Empty;
            var role = principal.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
            var rawClusters = principal.FindFirst("clusters")?.Value ?? string.Empty;
            var clusters    = rawClusters.Length > 0
                ? rawClusters.Split(',', StringSplitOptions.RemoveEmptyEntries)
                : [];

            // Parse subscriberId — "owner" sub is not a Guid
            var subjectId = Guid.TryParse(sub, out var g) ? g : Guid.Empty;

            return new TokenClaims(subjectId, role, clusters, jwt.ValidTo);
        }
        catch
        {
            return null;
        }
    }

    private string BuildToken(IEnumerable<Claim> claims, TimeSpan lifetime)
    {
        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var now   = DateTime.UtcNow;

        var token = new JwtSecurityToken(
            issuer:             _issuer,
            audience:           _audience,
            claims:             claims,
            notBefore:          now,
            expires:            now.Add(lifetime),
            signingCredentials: creds);

        return _handler.WriteToken(token);
    }
}
