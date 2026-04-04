export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => {
  const useAzureStorage =
    env("AZURE_STORAGE_ACCOUNT", "") !== "" &&
    env("AZURE_STORAGE_ACCOUNT_KEY", "") !== "";

  return {
    upload: useAzureStorage
      ? {
          config: {
            provider: "@strapi/provider-upload-azure-storage",
            providerOptions: {
              account: env("AZURE_STORAGE_ACCOUNT"),
              accountKey: env("AZURE_STORAGE_ACCOUNT_KEY"),
              containerName: env("AZURE_STORAGE_CONTAINER_NAME", "media"),
              cdnBaseUrl: env("CDN_BASE_URL", ""),
              defaultPath: "uploads",
              maxConcurrent: 10,
            },
          },
        }
      : {
          // Default local upload (development — files go to public/uploads/)
          config: {
            provider: "local",
          },
        },
  };
};
