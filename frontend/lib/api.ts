import axios from "axios";
import { config, getApiUrl } from "@/lib/config";

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
});

export { getApiUrl };
