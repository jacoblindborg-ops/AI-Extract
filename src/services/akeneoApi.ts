/**
 * Akeneo REST API Service
 * Direct API calls without SDK - no timeout limitations!
 */

export interface AkeneoConfig {
  baseUrl: string;
  clientId?: string;
  secret?: string;
  username?: string;
  password?: string;
}

class AkeneoApiService {
  private config: AkeneoConfig | null = null;
  private token: string | null = null;

  configure(config: AkeneoConfig) {
    this.config = config;
  }

  /**
   * Set access token directly (useful for iframe where parent can pass token)
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Get authentication token
   * For iframe: You can pass credentials via URL params or environment
   */
  async getToken(): Promise<string> {
    if (this.token) {
      return this.token as string;
    }

    if (!this.config) {
      throw new Error('Akeneo API not configured');
    }

    // OAuth flow with proper Akeneo authentication
    if (this.config.clientId && this.config.secret) {
      const authUrl = `${this.config.baseUrl}/api/oauth/v1/token`;
      console.log('[Akeneo API] Attempting OAuth at:', authUrl);

      // Akeneo requires Basic Auth header with client credentials
      const basicAuth = btoa(`${this.config.clientId}:${this.config.secret}`);

      // Build form-encoded body
      const formBody = new URLSearchParams({
        grant_type: 'password',
        username: this.config.username || '',
        password: this.config.password || '',
      });

      console.log('[Akeneo API] Request details:', {
        url: authUrl,
        method: 'POST',
        grantType: 'password',
        username: this.config.username,
      });

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Akeneo API] Auth failed:', response.status, errorText);
        throw new Error(`Failed to authenticate with Akeneo: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new Error('No access token received from Akeneo');
      }
      this.token = data.access_token;
      return this.token as string;
    }

    throw new Error('No authentication method configured');
  }

  /**
   * Get product by UUID
   */
  async getProduct(uuid: string): Promise<any> {
    const url = `${this.config!.baseUrl}/api/rest/v1/products-uuid/${uuid}`;
    console.log('[Akeneo API] Fetching product from:', url);
    console.log('[Akeneo API] Product UUID:', uuid);

    // Try session-based auth first (for iframe in Akeneo Cloud)
    let response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session-based auth
    });

    console.log('[Akeneo API] Response status:', response.status);

    // If session auth fails, try OAuth token
    if (!response.ok && response.status === 401) {
      console.log('[Akeneo API] Session auth failed, trying OAuth token...');
      const token = await this.getToken();

      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Akeneo API] Error response:', errorText);
      throw new Error(`Failed to fetch product: ${response.statusText}. ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get family by code
   */
  async getFamily(code: string): Promise<any> {
    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/families/${code}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch family: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get attribute by code
   */
  async getAttribute(code: string): Promise<any> {
    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/attributes/${code}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch attribute: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get attribute options
   */
  async getAttributeOptions(attributeCode: string): Promise<any[]> {
    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/attributes/${attributeCode}/options`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch options: ${response.statusText}`);
    }

    const data = await response.json();
    return data._embedded?.items || [];
  }

  /**
   * Update product by UUID
   */
  async updateProduct(uuid: string, data: any): Promise<any> {
    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/products-uuid/${uuid}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update product: ${response.statusText}\n${errorText}`);
    }

    return response.status === 204 ? { success: true } : response.json();
  }
}

export const akeneoApi = new AkeneoApiService();
