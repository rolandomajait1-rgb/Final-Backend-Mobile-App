# Design Document: Search with Copy-to-Clipboard Feature

## Overview

The search-copy-clipboard feature enables users to search for articles through a modal interface accessible from the HomeHeader component and copy search results to their device clipboard. The feature integrates with the existing backend SearchController API and leverages React Native's Clipboard API for copy functionality.

**Key Design Goals:**
- Seamless integration with existing HomeHeader component
- Fast, responsive search with debounced input
- Clear visual feedback for copy operations
- Robust error handling for network and clipboard failures
- Accessibility compliance with screen readers
- Consistent design system adherence

## Architecture

### Component Hierarchy

```
HomeHeader
├── Search Icon (TouchableOpacity)
│   └── triggers SearchModal
│
SearchModal (Modal)
├── SearchHeader
│   ├── Close Button
│   └── Search Input Field
├── SearchContent
│   ├── LoadingIndicator (conditional)
│   ├── SearchResultsList
│   │   └── ResultItem (FlatList)
│   │       ├── Article Title
│   │       ├── Article Excerpt
│   │       ├── Category Badge
│   │       └── Copy Button
│   ├── EmptyState (conditional)
│   └── ErrorMessage (conditional)
└── CopyFeedback Toast
```

### Data Flow

```
User taps search icon
    ↓
SearchModal opens with focused input
    ↓
User types query
    ↓
Debounce timer (300ms)
    ↓
Validate query (non-empty, non-whitespace)
    ↓
API call to SearchBackend
    ↓
Display loading state
    ↓
Receive results
    ↓
Render SearchResultsList
    ↓
User taps copy button
    ↓
Copy to clipboard
    ↓
Display success feedback (2 seconds)
```

### State Management

The SearchModal component manages the following state:

```javascript
{
  searchQuery: string,           // Current search input
  results: Article[],            // Array of search results
  isLoading: boolean,            // Loading state during API call
  error: string | null,          // Error message if any
  showCopyFeedback: boolean,     // Copy success feedback visibility
  copyFeedbackMessage: string,   // Message to display
  isModalVisible: boolean,       // Modal visibility state
}
```

## Components and Interfaces

### SearchModal Component

**Purpose:** Main container for search functionality

**Props:**
```typescript
interface SearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  onArticleSelect?: (article: Article) => void;
}
```

**Responsibilities:**
- Manage search state and lifecycle
- Handle API calls with debouncing
- Coordinate between child components
- Manage keyboard visibility

### SearchHeader Component

**Purpose:** Header section with close button and search input

**Props:**
```typescript
interface SearchHeaderProps {
  onClose: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  inputRef: React.RefObject<TextInput>;
}
```

**Features:**
- Close button with Ionicons
- TextInput with "Search articles..." placeholder
- Auto-focus on mount
- Keyboard type: "default"

### ResultItem Component

**Purpose:** Individual search result display with copy functionality

**Props:**
```typescript
interface ResultItemProps {
  article: Article;
  onCopy: (article: Article) => void;
  isLoading?: boolean;
}
```

**Structure:**
```
┌─────────────────────────────────┐
│ Title (primary text)            │
│ Excerpt (secondary text)        │
│ Category Badge | Copy Button    │
└─────────────────────────────────┘
```

**Interactions:**
- Tap item or copy button → triggers copy action
- Visual feedback on press (opacity change)
- Accessible labels for screen readers

### CopyFeedback Component

**Purpose:** Toast-style feedback for copy operations

**Props:**
```typescript
interface CopyFeedbackProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}
```

**Behavior:**
- Success: Green background (#27ae60), "Copied to clipboard" message
- Error: Red background (#e74c3c), "Failed to copy" message
- Auto-dismiss after 2 seconds (success) or 3 seconds (error)
- Positioned at bottom of screen

## Data Models

### Article (from backend)

```typescript
interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  featured_image: string;
  featured_image_url: string;
  status: 'published' | 'draft' | 'archived';
  published_at: string;
  author_id: number;
  author_name: string;
  display_author_name: string;
  categories: Category[];
  tags: Tag[];
  likes_count: number;
  is_liked: boolean;
}
```

### SearchResponse (from API)

```typescript
interface SearchResponse {
  data: Article[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
```

### ClipboardContent

```typescript
interface ClipboardContent {
  text: string; // Format: "[Title]\n[URL]"
}
```

## API Integration

### Search Endpoint

**Endpoint:** `GET /api/search`

**Query Parameters:**
- `q` (string): Search query (minimum 3 characters)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Article Title",
      "excerpt": "Article excerpt...",
      "slug": "article-slug",
      "featured_image_url": "https://...",
      "author_name": "Author Name",
      "categories": [
        {
          "id": 1,
          "name": "Category Name"
        }
      ]
    }
  ],
  "current_page": 1,
  "last_page": 1,
  "per_page": 20,
  "total": 5
}
```

**Error Responses:**
- 400: Invalid query (too short)
- 500: Server error
- Network timeout: No response

### Implementation Details

**Base URL:** Configured in environment or API service

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}
```

**Timeout:** 10 seconds

## Copy-to-Clipboard Implementation

### Clipboard API Usage

```javascript
import { Clipboard } from 'react-native';

const copyToClipboard = async (article: Article) => {
  try {
    const url = `${APP_URL}/articles/${article.slug}`;
    const content = `${article.title}\n${url}`;
    
    await Clipboard.setString(content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Content Format

**Format:** `[Title]\n[URL]`

**Example:**
```
Understanding React Native Performance
https://app.example.com/articles/understanding-react-native-performance
```

**Constraints:**
- Plain text only (no HTML/markdown)
- Maximum length: 4096 characters (React Native limit)
- Only most recent copy retained

## Error Handling

### Error Types and Responses

| Error Type | Message | Color | Action |
|-----------|---------|-------|--------|
| Network Error | "Network error. Please try again." | #e74c3c | Retry button |
| API Error | "Failed to load results. Please try again." | #e74c3c | Retry button |
| Clipboard Unavailable | "Clipboard not available" | #e74c3c | Dismiss |
| Copy Failed | "Failed to copy" | #e74c3c | Dismiss |
| Empty Results | "No articles found" | #555555 | Suggest new search |

### Error Recovery Flow

```
Error occurs
    ↓
Display error message
    ↓
User can:
  - Dismiss error (clears message)
  - Retry operation (re-triggers action)
  - New search (clears error and results)
    ↓
Interface remains functional
```

### Error Boundaries

- Wrap SearchModal in error boundary to catch unexpected errors
- Log errors to console in development
- Display generic message to user on unexpected errors

## Performance Considerations

### Debouncing

**Implementation:** 300ms debounce on search input

```javascript
const [searchQuery, setSearchQuery] = useState('');
const debounceTimer = useRef(null);

const handleSearchChange = (text) => {
  setSearchQuery(text);
  
  clearTimeout(debounceTimer.current);
  debounceTimer.current = setTimeout(() => {
    if (text.trim().length > 0) {
      performSearch(text);
    }
  }, 300);
};
```

**Benefits:**
- Reduces API calls during rapid typing
- Improves perceived performance
- Reduces server load

### Result Limiting

- Maximum 20 results per query (backend pagination)
- FlatList with `maxToRenderPerBatch={10}` for smooth scrolling
- `updateCellsBatchingPeriod={50}` for optimized rendering

### Memory Management

- Clear results when modal closes
- Unsubscribe from API calls on unmount
- Cancel pending requests on new search

### Rendering Optimization

```javascript
const ResultItem = React.memo(({ article, onCopy }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.article.id === nextProps.article.id;
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Debouncing prevents rapid API calls

*For any* sequence of rapid text inputs within 300ms, only one API call should be made after the debounce period expires.

**Validates: Requirements 2.1**

### Property 2: Empty queries don't trigger API calls

*For any* search query that is empty or contains only whitespace characters, no API call should be made to the SearchBackend.

**Validates: Requirements 2.5**

### Property 3: Search results are limited to 20 items

*For any* search query that returns results, the SearchInterface should display a maximum of 20 results regardless of total matches.

**Validates: Requirements 3.5**

### Property 4: Copy content format is correct

*For any* article that is copied, the clipboard content should be in the format "[Title]\n[URL]" with no HTML or markdown formatting.

**Validates: Requirements 5.1, 5.2**

### Property 5: Only latest copy is retained

*For any* sequence of copy operations on different articles, the clipboard should contain only the content from the most recent copy.

**Validates: Requirements 5.3**

### Property 6: Copy feedback displays for correct duration

*For any* successful copy operation, the CopyFeedback message should be visible for exactly 2 seconds before auto-dismissing.

**Validates: Requirements 4.3**

### Property 7: Search state resets on modal close

*For any* search session, when the SearchModal is dismissed, the search state (query, results, errors) should be cleared and reset to idle.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 8: Results contain required fields

*For any* search result item displayed, it should include the article title, excerpt, and at least one category.

**Validates: Requirements 3.1**

### Property 9: Rapid typing preserves all characters

*For any* sequence of rapid text inputs, all characters should be preserved in the search query without loss or duplication.

**Validates: Requirements 8.4**

### Property 10: Modal dismissal works from any state

*For any* state of the SearchModal (loading, results, error), the user should be able to dismiss it via close button or back gesture.

**Validates: Requirements 1.3**

### Property 11: Errors don't block new searches

*For any* error state displayed, the user should be able to perform a new search without clearing the error first.

**Validates: Requirements 6.4, 6.5**

### Property 12: App lifecycle preserves search state

*For any* active SearchModal, when the app transitions to background and returns to foreground, the search state should be maintained if the modal is still open.

**Validates: Requirements 7.4**

## Error Handling

### Network Errors

**Scenario:** API request fails due to network issues

**Handling:**
1. Catch network error in try-catch
2. Set error state with "Network error. Please try again."
3. Display error message with retry button
4. User can retry or dismiss

**Code:**
```javascript
try {
  const response = await fetch(searchUrl, { timeout: 10000 });
  // ...
} catch (error) {
  if (error.message.includes('timeout')) {
    setError('Network error. Please try again.');
  } else {
    setError('Failed to load results. Please try again.');
  }
}
```

### API Errors

**Scenario:** Backend returns error status (500, etc.)

**Handling:**
1. Check response status
2. Parse error message if available
3. Display user-friendly error message
4. Provide retry option

### Clipboard Errors

**Scenario:** Clipboard API unavailable or fails

**Handling:**
1. Wrap Clipboard.setString in try-catch
2. Detect unavailability vs. failure
3. Display appropriate error message
4. Allow user to dismiss

**Code:**
```javascript
try {
  await Clipboard.setString(content);
  showCopyFeedback('Copied to clipboard', 'success');
} catch (error) {
  if (error.message.includes('unavailable')) {
    showCopyFeedback('Clipboard not available', 'error');
  } else {
    showCopyFeedback('Failed to copy', 'error');
  }
}
```

### Input Validation Errors

**Scenario:** User submits empty or invalid query

**Handling:**
1. Validate query before API call
2. Trim whitespace
3. Check minimum length (3 characters per backend)
4. Don't display error, silently skip API call

## Testing Strategy

### Unit Testing

**Focus Areas:**
- Input validation (empty, whitespace, length)
- Debounce timer behavior
- Clipboard content formatting
- Error message display
- State transitions

**Example Tests:**
```javascript
describe('SearchModal', () => {
  test('empty query does not trigger API call', () => {
    // Verify no API call for empty input
  });

  test('copy formats content correctly', () => {
    // Verify clipboard content format
  });

  test('error state allows new search', () => {
    // Verify error doesn't block new searches
  });
});
```

### Property-Based Testing

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check or similar library for React Native
- Tag each test with feature and property reference

**Property Test Examples:**

```javascript
// Property 1: Debouncing prevents rapid API calls
test('Feature: search-copy-clipboard, Property 1: Debouncing prevents rapid API calls', () => {
  fc.assert(
    fc.property(fc.array(fc.string()), (inputs) => {
      // Generate rapid inputs and verify only one API call
      // after debounce period
    }),
    { numRuns: 100 }
  );
});

// Property 2: Empty queries don't trigger API calls
test('Feature: search-copy-clipboard, Property 2: Empty queries don\'t trigger API calls', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 0, maxLength: 10 }), (query) => {
      const trimmed = query.trim();
      // Verify API call only if trimmed.length > 0
    }),
    { numRuns: 100 }
  );
});

// Property 4: Copy content format is correct
test('Feature: search-copy-clipboard, Property 4: Copy content format is correct', () => {
  fc.assert(
    fc.property(fc.record({
      title: fc.string(),
      slug: fc.string()
    }), (article) => {
      const content = formatCopyContent(article);
      // Verify format matches "[Title]\n[URL]"
      // Verify no HTML/markdown
    }),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Focus Areas:**
- Search flow end-to-end
- Copy flow end-to-end
- Error recovery flows
- Modal lifecycle

**Test Scenarios:**
1. User opens search → types query → views results → copies item → sees feedback
2. User opens search → types invalid query → sees error → retries
3. User opens search → network fails → sees error → dismisses → new search works
4. User opens search → closes modal → reopens → state is cleared

### Manual Testing Checklist

- [ ] Search icon opens modal with focused input
- [ ] Typing triggers debounced search
- [ ] Loading indicator appears during search
- [ ] Results display with title, excerpt, category
- [ ] Copy button works and shows feedback
- [ ] Tapping result item also copies
- [ ] Empty results show "No articles found"
- [ ] Network error shows appropriate message
- [ ] Clipboard error shows appropriate message
- [ ] Close button dismisses modal
- [ ] Back gesture dismisses modal
- [ ] Keyboard appears/disappears with modal
- [ ] Screen reader announces all elements
- [ ] Copy feedback uses correct color
- [ ] Results scroll smoothly
- [ ] Rapid typing doesn't lose characters

## Implementation Notes

### Dependencies

```json
{
  "react-native": "^0.73.0",
  "expo": "^50.0.0",
  "@react-native-clipboard/clipboard": "^1.13.0",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

### File Structure

```
mobile/src/
├── components/
│   ├── search/
│   │   ├── SearchModal.js
│   │   ├── SearchHeader.js
│   │   ├── ResultItem.js
│   │   ├── CopyFeedback.js
│   │   └── SearchResultsList.js
│   └── home/
│       └── HomeHeader.js (modified)
├── api/
│   └── searchApi.js (new)
├── hooks/
│   └── useSearch.js (new)
└── utils/
    └── clipboardUtils.js (new)
```

### Configuration

**Environment Variables:**
```
REACT_APP_API_BASE_URL=https://api.example.com
REACT_APP_ARTICLE_BASE_URL=https://app.example.com
```

**Search Configuration:**
```javascript
const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 3,
  MAX_RESULTS: 20,
  API_TIMEOUT_MS: 10000,
  COPY_FEEDBACK_DURATION_MS: 2000,
};
```

### Accessibility Considerations

- Search input: `accessibilityLabel="Search articles"`
- Copy button: `accessibilityLabel="Copy article"`
- Copy feedback: `accessibilityLiveRegion="polite"`
- All interactive elements: `accessible={true}`
- Color contrast: WCAG AA compliant

### Browser/Device Compatibility

- iOS 12+
- Android 6+
- React Native 0.70+
- Expo SDK 50+

