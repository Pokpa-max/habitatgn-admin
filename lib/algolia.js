import algoliasearch from "algoliasearch/";
import { createNullCache } from "@algolia/cache-common";

const HITS_PER_PAGE = 30

export const client = algoliasearch(
  process.env.NEXT_PUBLIC_APPLICATION_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
  {
    responsesCache: createNullCache(),
  }
);
const index = (indexName) => client.initIndex(indexName);

export const searchForSelect = async (inputValue, indexName, formatData, options = {}) => {
  try {
    const elements = [];
    const hits = await index(indexName).search(inputValue, options);

    hits.hits.forEach((hit) => {
      elements.push(formatData(hit));
    });
    return elements;
  } catch (error) {
    return [];
  }
};

export const search = async (value, indexName, options) => {
  const algoliaOptions = {
    hitsPerPage: HITS_PER_PAGE,
    ...options,
  };
  const elements = [];
  const hits = await index(indexName).search(value, algoliaOptions);
  hits.hits.forEach((hit) => {
    elements.push({ ...hit, id: hit.objectID });
  });

  return { elements, hits };
};
