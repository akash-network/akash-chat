'use client';

import { motion } from "framer-motion";
import { ArrowRight, Gauge, Info, MessageCircle, Layers, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { models, Model } from "@/app/config/models";
import { useChatContext } from "@/app/context/ChatContext";
import { ModelConfig } from '@/components/model-config';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModelDetailClientProps {
  modelId: string;
  model?: Model;
}

export function ModelDetailClient({ modelId, model: serverModel }: ModelDetailClientProps) {
  const router = useRouter();
  const {
    setModelSelection,
    handleNewChat,
    isConfigOpen,
    setIsConfigOpen,
    systemPrompt,
    setSystemPrompt,
    setTemperature,
    setTopP,
    modelSelection
  } = useChatContext();

  // Use the model passed from the server if available, otherwise find it
  const model = serverModel || models.find(m => m.id.toLowerCase() === modelId.toLowerCase());

  // If model not found, show error state
  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h1 className="text-2xl font-bold mb-4">Model Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The requested model could not be found or is currently unavailable.
        </p>
        <Button asChild>
          <Link href="/models">
            View Available Models
          </Link>
        </Button>
      </div>
    );
  }

  // Function to start a chat with this model
  const startChat = () => {
    if (!model.available) {return;}

    setModelSelection(model.id);
    handleNewChat();
    router.push(`/models/${model.id}/chat`);
  };

  return (
    <>
      <div className="flex-1 overflow-auto bg-background dark:bg-background">
        <div className="max-w-4xl mx-auto px-4">
          {/* Skip the header if it's already rendered on the server */}
          {!serverModel && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">{model.name}</h1>
              <p className="text-muted-foreground">
                {model.description || "An AI language model for chat and text generation."}
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Model Card */}
            <motion.div
              className="col-span-1 md:col-span-2 bg-background rounded-lg border p-6"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex flex-col h-full">
                <h2 className="text-xl font-semibold mb-4">About this Model</h2>

                <div className="space-y-4 flex-grow">
                  <ReactMarkdown>{model.aboutContent || "No detailed description available for this model."}</ReactMarkdown>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Display token limit if available */}
                  {model.tokenLimit && (
                    <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                      <Gauge className="h-3 w-3 mr-1" />
                      {(model.tokenLimit / 1000).toFixed(0)}K Context
                    </div>
                  )}

                  {/* Display model provider if available */}
                  {model.owned_by && (
                    <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                      <Info className="h-3 w-3 mr-1" />
                      {model.owned_by}
                    </div>
                  )}

                  {model.architecture && (
                    <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                      <Layers className="h-3 w-3 mr-1" />
                      {model.architecture}
                    </div>
                  )}

                  {model.hf_repo && (
                    <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.5 1.5 0 0 1 .713.174 1.487 1.487 0 0 1 .617 2.013c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 .617-2.013 1.5 1.5 0 0 1 .713-.174m-10.68 1.55a.96.96 0 1 1 0 1.921.96.96 0 0 1 0-1.92m13.838 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32q-.011.001-.02.006l-.044.026-.01.008-.03.024q-.018.017-.035.036l-.032.04a1 1 0 0 0-.058.09l-.014.025q-.049.088-.11.19a1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.173.18q-.035.029-.075.058a1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022q-.094.03-.216.087-.06.028-.125.063l-.13.074q-.067.04-.136.086a3 3 0 0 0-.135.096 3 3 0 0 0-.26.219 2 2 0 0 0-.12.121 2 2 0 0 0-.106.128l-.002.002a2 2 0 0 0-.09.132l-.001.001a1.2 1.2 0 0 0-.105.212q-.013.036-.024.073c-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454m.836 10.354c.824-1.19.766-2.082-.365-3.194-1.13-1.112-1.789-2.738-1.789-2.738s-.246-.945-.806-.858-.97 1.499.202 2.362c1.173.864-.233 1.45-.685.64-.45-.812-1.683-2.896-2.322-3.295s-1.089-.175-.938.647 2.822 2.813 2.562 3.244-1.176-.506-1.176-.506-2.866-2.567-3.49-1.898.473 1.23 2.037 2.16c1.564.932 1.686 1.178 1.464 1.53s-3.675-2.511-4-1.297c-.323 1.214 3.524 1.567 3.287 2.405-.238.839 2.71-1.587 3.216-.642.506.946 3.49 2.056 3.522 2.064 1.29.33 4.568 1.028 5.713-.624m5.349 0c-.824-1.19-.766-2.082.365-3.194 1.13-1.112 1.789-2.738 1.789-2.738s.246-.945.806-.858.97 1.499-.202 2.362c-1.173.864.233 1.45.685.64.451-.812 1.683-2.896 2.322-3.295s1.089-.175.938.647-2.822 2.813-2.562 3.244 1.176-.506 1.176-.506 2.866-2.567 3.49-1.898-.473 1.23-2.037 2.16c-1.564.932-1.686 1.178-1.464 1.53s3.675-2.511 4-1.297c.323 1.214-3.524 1.567-3.287 2.405.238.839 2.71-1.587 3.216-.642.506.946-3.49 2.056-3.522 2.064-1.29.33-4.568 1.028-5.713-.624" /></svg>
                      {model.hf_repo}
                    </div>
                  )}

                  {model.parameters && (
                    <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      {model.parameters.toLocaleString()} Parameters
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Action Card */}
            <motion.div
              className="bg-background rounded-lg border p-6 flex flex-col"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <p className="text-muted-foreground mb-6">
                Deploy {model.name} on Akash or start a conversation to experience its capabilities.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={startChat}
                  className={cn(
                    "w-full text-md flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6",
                    !model.available && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!model.available}
                >
                  Start Chat
                  <MessageCircle className="h-5 w-5 ml-1" />
                </Button>
                {model.deployUrl && (
                  <Button
                    asChild
                    className="w-full text-md flex items-center justify-center gap-2 py-6 hover:bg-border"
                    variant="outline"
                  >
                    <Link href={model.deployUrl} aria-label="Deploy now">
                      Deploy Now
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </Link>
                  </Button>
                )}
                {!model.available && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    This model is currently unavailable for chat
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            className="bg-background rounded-lg border p-6 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4">Why use AkashChat for {model.name}?</h2>
            <div className="space-y-4">
              <ReactMarkdown>{model.infoContent || "No information text available for this model."}</ReactMarkdown>
            </div>
          </motion.div>
        </div>
      </div>

      <ModelConfig
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        currentModel={modelSelection}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        onTemperatureChange={setTemperature}
        onTopPChange={setTopP}
      />
    </>
  );
}