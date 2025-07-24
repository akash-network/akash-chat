'use client';

import { Gauge, Info, Layers, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { Model } from "@/app/config/models";
import { useChatContext } from "@/app/context/ChatContext";
import { cn } from "@/lib/utils";

import { ModelThumbnail } from "../branding/model-thumbnail";

interface ModelsPageClientProps {
    models: Model[];
}

export function ModelsPageClient({ models }: ModelsPageClientProps) {
    const {
        setModelSelection,
    } = useChatContext();
    const router = useRouter();

    const handleModelClick = (model: Model) => {
        // All models passed from server are available
        setModelSelection(model.id);
        router.push('/models/' + model.id);
    };

    return (
        <div className="flex-1 overflow-auto p-4 bg-background dark:bg-background">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Available Models</h1>
                    <p className="text-muted-foreground">
                        Select a model to learn more or start a new conversation
                    </p>
                </header>

                {/* Models Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {models.map((model: Model) => (
                        <div
                            key={model.id}
                            onClick={() => handleModelClick(model)}
                            className={cn(
                                "group/card rounded-lg border cursor-pointer bg-background text-foreground",
                                "outline outline-2 -outline-offset-2 outline-primary/0 transition-all",
                                "hover:shadow-lg hover:outline-primary/30 hover:translate-y-[-2px] focus-visible:outline-primary",
                                "flex h-full flex-col animate-fade-in relative"
                            )}
                        >
                            <div className="p-4 pt-4 h-[9.5rem] overflow-hidden">
                                <div className="relative h-full w-full">
                                    {/* model images */}
                                    <div className="h-full w-full rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 object-cover object-center">
                                        <ModelThumbnail thumbnailId={model.thumbnailId} className="h-full w-full fill-primary"/>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-y-2 p-4 grow pt-0">
                                <h4 className="text-base font-bold">{model.name}</h4>
                                <div className="text-sm leading-6 text-muted-foreground line-clamp-3 grow">
                                    <p>{model.description || "No description available"}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {/* Display token limit if available */}
                                    {model.tokenLimit && (
                                        <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                                            <Gauge className="h-3 w-3 mr-1" />
                                            {(model.tokenLimit / 1000).toFixed(0)}K
                                        </div>
                                    )}

                                    {/* Display model provider if available */}
                                    {model.owned_by && (
                                        <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                                            <Info className="h-3 w-3 mr-1" />
                                            {model.owned_by}
                                        </div>
                                    )}

                                    {/* Display model parameters if available */}
                                    {model.parameters && (
                                        <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                                            <Settings className="h-3 w-3 mr-1" />
                                            {model.parameters}
                                        </div>
                                    )}

                                    {/* Display model architecture if available */}
                                    {model.architecture && (
                                        <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent text-muted-foreground rounded-[0.25rem] h-6 px-2 text-xs">
                                            <Layers className="h-3 w-3 mr-1" />
                                            {model.architecture}
                                        </div>
                                    )}

                                    {/* Availability badge - all server-side models are available */}
                                    <div className="inline-flex items-center gap-1 whitespace-nowrap border font-medium border-border-contrast bg-transparent rounded-[0.25rem] h-6 px-2 text-xs text-muted-foreground">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkle fill-muted-foreground">
                                            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                                        </svg>
                                        Available
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 