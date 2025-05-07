import { AkashGenLogo } from "./akash-gen";
import { DeepSeekLogo } from "./deepseek";
import { Llama1Logo } from "./llama-1";
import { Llama2Logo } from "./llama-2";
import { Llama3Logo } from "./llama-3";
import { Llama4Logo } from "./llama-4";

export const ModelThumbnail = ({ thumbnailId, ...props }: { thumbnailId: string | undefined } & React.SVGProps<SVGSVGElement>) => {
    switch (thumbnailId) {
        case "akash-gen": return <AkashGenLogo {...props} />
        case "deepseek": return <DeepSeekLogo {...props} />
        case "llama-1": return <Llama1Logo {...props} />
        case "llama-2": return <Llama2Logo {...props} />
        case "llama-3": return <Llama3Logo {...props} />
        case "llama-4": return <Llama4Logo {...props} />
        default: return <Llama1Logo {...props} />
    }
}