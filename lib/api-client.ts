export const apiClient = {
  login: async (username: string, password: string) => {
    const response = await fetch('https://your-railway-url/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  }
};
