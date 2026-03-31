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

export interface DashboardConfig {
  widgets: any[]; // This should match the Python Pydantic schemas
}

export interface CreateDashboardAiResponse {
  dashboard_id: string;
  dashboard_config: DashboardConfig;
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

export const getDatasetColumns = async (datasetId: string): Promise<{ columns: string[] }> => {
  try {
    const response = await axios.get(`${AI_APP_URL}/dataset/${datasetId}/columns`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching columns for dataset ${datasetId} from AI service:`, error);
    throw error;
  }
};

export const createAiDashboard = async (
  datasetId: string,
  focusFields?: string[]
): Promise<CreateDashboardAiResponse> => {
  try {
    const response = await axios.post(`${AI_APP_URL}/dashboard/create`, {
      dataset_id: datasetId,
      focus_fields: focusFields
    });
    return response.data;
  } catch (error) {
    console.error('Error creating AI dashboard:', error);
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
