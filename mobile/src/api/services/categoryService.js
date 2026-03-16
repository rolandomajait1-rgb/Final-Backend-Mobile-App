import client from '../client';
import ENDPOINTS from '../endpoints';

export const getCategories = () =>
  client.get(ENDPOINTS.CATEGORIES);
