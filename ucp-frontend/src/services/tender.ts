export const createTender = async (formData: FormData) => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenders/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return await response.json();
};