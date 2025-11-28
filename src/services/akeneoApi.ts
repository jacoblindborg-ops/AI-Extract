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

    // For now, accept token from config or generate from credentials
    // In production, handle OAuth flow properly
    if (this.config.clientId && this.config.secret) {
      const response = await fetch(`${this.config.baseUrl}/api/oauth/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'password',
          username: this.config.username,
          password: this.config.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Akeneo');
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
    const token = await this.getToken();

    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/products-uuid/${uuid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get family by code
   */
  async getFamily(code: string): Promise<any> {
    const token = await this.getToken();

    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/families/${code}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
    const token = await this.getToken();

    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/attributes/${code}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
    const token = await this.getToken();

    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/attributes/${attributeCode}/options`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
    const token = await this.getToken();

    const response = await fetch(
      `${this.config!.baseUrl}/api/rest/v1/products-uuid/${uuid}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
