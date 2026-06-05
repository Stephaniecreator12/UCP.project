import { ApiResult } from "@/types/api";
import { UserProfileValue } from "@/types/profile";
import { api,parseApiError } from "./config";
import { getToken } from "./auth";
export const getme = async(): Promise<ApiResult<UserProfileValue>>=> {
    try{
        const response = await api.get(`/users/me`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
});
        return {
            error: false,
            data: response.data.data
        };
    }catch(e){
        return{
            error: true,
            message: parseApiError(e),
        }
    }
}