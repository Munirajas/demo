export async function serverGqlFetch
  TData,
  TVars extends Record<string, unknown> = Record<string, unknown>,
>(query: string, variables?: TVars): Promise<TData> {
  
  const token = await getAccessToken();
  
  // ── ADD: Debug logging ──────────────────────────
  console.log('[serverGqlFetch] token exists:', Boolean(token));
  console.log('[serverGqlFetch] token prefix:', token?.slice(0, 20));
  console.log('[serverGqlFetch] endpoint:', process.env.NEXT_PUBLIC_GRAPHQL_URL);
  console.log('[serverGqlFetch] tenant:', process.env.TENANT_ID);
  console.log('[serverGqlFetch] variables:', JSON.stringify(variables));
  // ────────────────────────────────────────────────

  let alreadyRefreshed = false;
  
  if (!token) {
    // ... rest of function
  }
  
  try {
    const result = await buildClient(token!).request<TData>(query, variables);
    
    // ── ADD: Log what actually came back ────────────
    console.log('[serverGqlFetch] raw result:', JSON.stringify(result));
    // ────────────────────────────────────────────────
    
    return result;
  } catch (error) {
    // ... existing catch
  }
}
