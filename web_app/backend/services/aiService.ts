import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AI_APP_URL = process.env.AI_APP_URL || 'http://localhost:8000';

export interface AiResponse {
  answer: string;
  chart?: {
    type: 'bar' | 'line' | 'pie';
    x: string[];
    y: (number | string)[];
  };
  table?: any[];
}

export const registerDatasetToAi = async (datasetId: string) => {
  try {
    const response = await axios.post(`${AI_APP_URL}/dataset/register`, {
      dataset_id: datasetId
    });
    return response.data;
  } catch (error) {
    console.error('Error registering dataset to AI service:', error);
    throw error;
  }
};

export const askAiQuestion = async (datasetId: string, question: string): Promise<AiResponse> => {
  try {
    const response = await axios.post(`${AI_APP_URL}/query`, {
      dataset_id: datasetId,
      question: question
    });
    return response.data;
  } catch (error) {
    console.error('Error querying AI service:', error);
    throw error;
  }
};
