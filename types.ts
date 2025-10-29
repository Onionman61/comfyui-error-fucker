
export interface Solution {
  title: string;
  steps: string[];
}

export interface Analysis {
  rootCause: {
    title:string;
    explanation: string;
  };
  solutions: Solution[];
}
