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
    // Use backend proxy to avoid CORS issues
    const proxyUrl = `/api/akeneo-proxy?method=GET&path=products-uuid/${uuid}`;
    console.log('[Akeneo API] Fetching product via proxy:', proxyUrl);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error('[Akeneo API] Non-JSON error response:', text);
        throw new Error(`Proxy error: ${text}`);
      }
      console.error('[Akeneo API] Error response:', errorData);
      throw new Error(errorData.message || errorData.details || 'Failed to fetch product');
    }

    return response.json();
  }

  /**
   * Get family by code
   */
  async getFamily(code: string): Promise<any> {
    const response = await fetch(`/api/akeneo-proxy?method=GET&path=families/${code}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch family');
    }

    return response.json();
  }

  /**
   * Get attribute by code
   */
  async getAttribute(code: string): Promise<any> {
    const response = await fetch(`/api/akeneo-proxy?method=GET&path=attributes/${code}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch attribute');
    }

    return response.json();
  }

  /**
   * Get attribute options
   */
  async getAttributeOptions(attributeCode: string): Promise<any[]> {
    const response = await fetch(`/api/akeneo-proxy?method=GET&path=attributes/${attributeCode}/options`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch options');
    }

    const data = await response.json();
    return data._embedded?.items || [];
  }

  /**
   * Update product by UUID
   */
  async updateProduct(uuid: string, productData: any): Promise<any> {
    const response = await fetch(`/api/akeneo-proxy?method=PATCH&path=products-uuid/${uuid}`, {
      method: 'POST', // We use POST to the proxy, it will forward as PATCH
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update product');
    }

    return response.json();
  }
}

export const akeneoApi = new AkeneoApiService();
