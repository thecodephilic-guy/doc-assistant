import { ValidPages } from "./constants";

type PagesConfig = {
  [key in ValidPages]: {
    title: string;
    description: string;
    metadata: {
      title: string;
      description: string;
    };
    // featuredDescription: string;
  };
};

export const pagesConfig: PagesConfig = {
  home: {
    title: "Home",
    description:
      "Stop scrolling through endless pages. Upload your documents and getinstant answers, summaries, and insights powered by AI.",
    metadata: {
      title: "Doc Assistant - Get more out of your pdf documents",
      description:
        "Doc Assistant is an application built with the focus on allowing you to extract exactly what you are looking for in your pdf. You can litterally chat with your pdf documents",
    },
  },
};
