import { ApiResult } from "@/types/api";
import { UserProfile } from "@/types/profile";
import { api, parseApiError } from "./config";
export const getme = async (): Promise<ApiResult<UserProfile>> => {
    try {
        const response = await api.get(`/users/me`); 
        return {
            error: false,
            data: response.data.data
        };
    } catch (e) {
        return {
            error: true,
            message: parseApiError(e),
        }
    }
}