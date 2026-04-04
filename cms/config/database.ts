import path from "path";

export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => {
  const client = env("DATABASE_CLIENT", "sqlite");

  const connections: Record<string, object> = {
    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          "..",
          env("DATABASE_FILENAME", ".tmp/data.db")
        ),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env("DATABASE_CONNECTION_TIMEOUT", "60000"),
    },
  };
};
