import flat from 'flat';
import { v4 as uuidv4 } from 'uuid';

const { flatten } = flat;

export default class JankyIndex {
  constructor(fields = []) {
    this.fields = fields;
    this.fieldIndexes = new Map();
    this.documentStore = new Map();
    
    // create an index for each field
    for (let field of fields) {
      this.fieldIndexes.set(field, new Map());
    }
  }

  put(indexedDocument, storedDocument) {
    let numFieldsIndexed = 0;
    const _id = uuidv4();
    const flattenedDoc = flatten(indexedDocument);

    for (let field of this.fields) {
      if (field in flattenedDoc) {
        const value = flattenedDoc[field];
        const fieldIndex = this.fieldIndexes.get(field);

        if (fieldIndex.has(value)) {
          fieldIndex.get(value).add(_id);
        } else {
          fieldIndex.set(value, new Set([_id]));
        }

        numFieldsIndexed += 1;
      }
    }

    if (numFieldsIndexed > 0) {
      this.documentStore.set(_id, storedDocument);
    }
  }

  query(filter) {
    const flattenedFilter = flatten(filter);
    const fieldMatches = new Map();

    for (let field in flattenedFilter) {
      if (!this.fieldIndexes.has(field)) {
        continue;
      }
      
      const value = flattenedFilter[field];
      const fieldIndex = this.fieldIndexes.get(field);

      if (!fieldIndex.has(value)) {
        continue;
      }

      const matchedDocIds = fieldIndex.get(value);
      for (let docId of matchedDocIds) {
        if (fieldMatches.has(docId)) {
          fieldMatches.get(docId).push(field);
        } else {
          fieldMatches.set(docId, [field]);
        }
      }
    }

    const results = [];
    const numFilters = Object.keys(flattenedFilter).length;
    for (let [docId, matched] of fieldMatches) {
      if (matched.length !== numFilters) {
        continue;
      }
      
      const result = {
        _id      : docId,
        score    : matched.length,
        matched  : matched,
        document : this.documentStore.get(docId)
      };

      results.push(result);
    }

    return results;
  }
}