import Link from "next/link";
import { FC } from "react";

export const CTAButton: FC = () => {
    return (
        <Link href="https://akashnet.typeform.com/to/rhR4cWxQ">
            <button
                className={`text-xs sm:text-sm font-semibold text-black dark:text-gray-100 cursor-pointer rounded-lg p-2 sm:p-3 transition-colors duration-200 hover:bg-[#ffb2b2]/90 bg-[#ce4747]`}
            >
                Want to run your own models?
            </button>
        </Link>
    );
};
