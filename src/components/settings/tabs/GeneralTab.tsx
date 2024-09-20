import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "~/components/primitives/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/primitives/Select";
import { SettingsSchemas } from "~/server/schema/Settings";
import { api } from "~/trpc/react";
import { Button } from "~/components/primitives/Button";
import { AlertCircle, Globe, Loader2, Check, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/primitives/Card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/primitives/Tooltip";
import { Skeleton } from "~/components/primitives/Skeleton";

const icons: Record<string, React.ReactNode> = {
  Ollama: "🦙",
  "LM Studio": (
    <img
      alt=""
      src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAYABgDASIAAhEBAxEB/8QAGQABAAIDAAAAAAAAAAAAAAAAAAEEAgUG/8QAJRAAAgIBAwMEAwAAAAAAAAAAAQIDBAAFESESImEjMUGxEzJR/8QAGQEAAgMBAAAAAAAAAAAAAAAAAQQAAgMF/8QAGxEAAwEAAwEAAAAAAAAAAAAAAAECAwQRIRL/2gAMAwEAAhEDEQA/AGm0KqQCITpB07AAoSW88Zbs6O6R9UcryHf9RCwzHTK8LsJHkhc7H02LAjn34y/etSQQkxozkg8pNL2+c6tU5r5kqkcrfrdSvFYiI+O5diDjIt2JJpC0hfc89zE/eMYeU37S9NFJNTUGCiarMULDYlTsR4y/X16SNHW2JrIb29dl2H84xjBErSE6REjU6nerOzSRwfhHwDIW+8Yxi3I3vKlMhb6P/9k="
    />
  ),
  Jan: "👋",
  OpenAI: (
    <img
      alt=""
      src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAYABcDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAUBA//EACcQAAEDAwMEAgMBAAAAAAAAAAECAwQABRESITETIkFhUXEUIyVD/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AIUGzJgWx67TS0440wHG4hGo95CUKWOMb5x6H1VpTspSpVvuX9uSMa2UlLbEfn/QgaT9Y+N/HC4sLcjzrgtC0wLw00rrIGv8ZQUDhSdjpyCMj1t4rJTlxmXtxw9B6zSFlSdekMuJJPHH7OeO/NBMulsjLZlFmC5bJcMJLsdxwuJcSVadSVY8Ej0QdqVXtD4kOw7S4HF225sqcDK15UwUrUcJXjJGUefmlBKt91jvMxS7PXbJcNHSQ6houJdbyThSfkZPo5qs7GkOttS4CDenlpKRKdCUMRxse1APaR5zjHNKUEiZfDbYzMC2KR1WWktrnNk6juVqSk+BqUd9icUpSg//2Q=="
    />
  ),
  OpenRouter: (
    <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAYABgDASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAUGAQT/xAAoEAABBAEDAwIHAAAAAAAAAAABAAIDBBEFBiESMWEUgSJBQlFSkcH/xAAWAQEBAQAAAAAAAAAAAAAAAAABAAL/xAAWEQEBAQAAAAAAAAAAAAAAAAABABH/2gAMAwEAAhEDEQA/AMJXrzWphFBG6R57ALQwbTAiDrdsMcfkwcD3KtadNp0kL26WYWux2DcH3HcrJ61X1P1ZdeD5Pxc0ZZjx9lrAs7tS1jb9StVE8NlsJDRxIeHnx5RRL8N2N0ZuCTlo6C7kYxxhEMl54pZIZGyRPLHtOQ5pwQr1bdtiNgbYgZMR9QPSSiKFJy7q25W2q5grwN6XD4nSDP6H9REUuxl//9k=" />
  ),
  "Any OpenAI-compatible": "🦜",
};

type ProviderSchema = z.infer<typeof SettingsSchemas.provider>;

export const GeneralTab = () => {
  // eslint-disable-next-line react-compiler/react-compiler
  "use no memo";

  const [isSaved, setIsSaved] = useState(false);
  const { data: generalSettings, isLoading: isSettingsLoading, refetch } = api.settings.general.useQuery();
  const { mutate: updateSettings, isPending: isSetProviderPending } = api.settings.setProvider.useMutation({
    onSuccess: async () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1000);
      await refetch();
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProviderSchema>({
    resolver: zodResolver(SettingsSchemas.provider),
    defaultValues: generalSettings || undefined,
    mode: "onChange",
  });

  const selectedProvider = watch("type");
  const baseUrl = watch("baseUrl");
  const apiKey = watch("apiKey");
  const selectedModel = watch("model");

  const [modelFetchError, setModelFetchError] = useState<string | null>(null);

  const {
    data: models,
    isLoading: isModelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = api.settings.getAvailbaleModels.useQuery({ baseUrl, apiKey }, { retry: false });

  const { data: providerDefaults } = api.settings.getProviderDefaults.useQuery(
    { name: selectedProvider || "" },
    { enabled: !!selectedProvider },
  );

  const { data: providerSettings, refetch: refetchProviderSettings } = api.settings.getProviderSettings.useQuery(
    { providerType: selectedProvider || "" },
    { enabled: !!selectedProvider },
  );

  useEffect(() => {
    if (modelsError) {
      setModelFetchError(modelsError.message);
    } else {
      setModelFetchError(null);
    }
  }, [modelsError]);

  useEffect(() => {
    if (generalSettings) {
      // temporary fix for reset not working
      setTimeout(() => {
        reset(generalSettings);
      }, 100);
    }
  }, [generalSettings, reset]);

  useEffect(() => {
    if (selectedProvider && providerSettings) {
      reset(providerSettings);
      void refetchModels();
    }
  }, [selectedProvider, providerSettings, reset, refetchModels]);

  const onProviderChange = (value: string) => {
    setValue("type", value as ProviderSchema["type"], { shouldDirty: true });
    void refetchProviderSettings();
  };

  const onSubmit = handleSubmit((data: ProviderSchema) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === "" ? undefined : value]),
    ) as ProviderSchema;
    updateSettings(cleanedData);
  });

  const modelError = useMemo(() => {
    return {
      model: "model" in errors ? errors.model : null,
      message: "model" in errors ? errors.model?.message : null,
    };
  }, [errors]);

  if (isSettingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const providerFields =
    SettingsSchemas.provider.options.find((option) => option.shape.type.value === selectedProvider)?.shape || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          AI Provider Settings
        </CardTitle>
        <CardDescription>Configure your AI provider and model settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      onProviderChange(value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {SettingsSchemas.provider.options.map((option) => (
                        <SelectItem key={option.shape.type.value} value={option.shape.type.value}>
                          <span className="flex items-center gap-2">
                            <span className="size-4">{icons[option.shape.type.value]}</span>
                            {option.shape.type.value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {Object.entries(providerFields).map(([fieldName]) => {
              if (fieldName === "type") return null;

              if (fieldName === "model") {
                return (
                  <div key={fieldName}>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Model
                    </label>
                    <Controller
                      name="model"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger id="model" className={modelError.model ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {isModelsLoading ? (
                              <SelectItem value="loading">Loading models...</SelectItem>
                            ) : modelFetchError ? (
                              <SelectItem value="error" disabled>
                                <AlertCircle className="mr-2 inline h-4 w-4" />
                                {modelFetchError}
                              </SelectItem>
                            ) : (
                              models?.map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {modelError.model && (
                      <div className="mt-1 text-sm text-red-600">
                        <AlertCircle className="mr-2 inline-block h-4 w-4" />
                        {modelError.message}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={fieldName}>
                  <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                  </label>
                  <Controller
                    name={fieldName as keyof ProviderSchema}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <Input {...field} id={fieldName} className="mt-1" intent="secondary" />
                        {error && (
                          <div className="mt-1 text-sm text-red-600">
                            <AlertCircle className="mr-2 inline-block h-4 w-4" />
                            {error.message}
                          </div>
                        )}
                      </>
                    )}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isSaved && <Check className="mr-2 inline h-4 w-4 text-green-500" />}
              {isSaved ? "Settings saved successfully!" : "Unsaved changes"}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  variant={isSaved ? "outline" : "default"}
                  disabled={isSetProviderPending || isSaved}
                >
                  {isSetProviderPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSaved ? "Saved" : isSetProviderPending ? "Saving..." : "Save Changes"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isSaved ? "Settings are up to date" : "Save your provider settings"}</TooltipContent>
            </Tooltip>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
