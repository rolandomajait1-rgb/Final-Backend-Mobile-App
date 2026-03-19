# Requirements Document

## Introduction

This feature adds a mobile welcome/landing screen to the La Verdad Herald React Native app. The screen mirrors the existing web `LandingPage.jsx` and serves as the first screen users see when they open the app. It presents the publication's branding, a tagline, and navigation entry points to Login and Sign Up. The screen is inserted before the main tab navigator in the app's navigation stack.

## Glossary

- **WelcomeScreen**: The mobile landing screen component that is the initial route in the app's navigation stack.
- **AppNavigator**: The root stack navigator defined in `mobile/src/navigation/AppNavigator.js`.
- **HeroSection**: The full-screen area displaying the background image, gradient overlay, logo, branding text, tagline, and action buttons.
- **Logo**: The school logo image (`logo.svg`) displayed in the hero section.
- **HeraldBranding**: The "La Verdad Herald" SVG wordmark (`la verdad herald.svg`) displayed below the logo.
- **GradientOverlay**: A semi-transparent gradient from blue (`rgba(18, 94, 124, 0.5)`) to black (`rgba(0, 0, 0, 0.7)`) layered over the background image.
- **BackgroundImage**: The `bg.jpg` image used as the hero background.
- **Tagline**: The text "The Official Higher Education Student Publication of La Verdad Christian College, Inc."
- **LoginButton**: A tappable button that navigates the user to the Login screen.
- **SignUpButton**: A tappable button that navigates the user to the Register screen.
- **LatestArticlesSection**: A scrollable section below the hero that displays the most recent published articles.
- **ArticleCard**: The existing `mobile/src/components/articles/ArticleCard.js` component used to render each article preview.

---

## Requirements

### Requirement 1: WelcomeScreen as Initial Route

**User Story:** As a new user opening the app, I want to see a branded welcome screen first, so that I understand what the app is before logging in.

#### Acceptance Criteria

1. THE AppNavigator SHALL render WelcomeScreen as the first screen in the navigation stack.
2. WHEN the app launches, THE WelcomeScreen SHALL be displayed before any authenticated content.
3. THE WelcomeScreen SHALL occupy the full screen including the area behind the status bar.

---

### Requirement 2: Hero Section with Branding

**User Story:** As a user on the welcome screen, I want to see the publication's logo, name, and tagline, so that I can identify the app.

#### Acceptance Criteria

1. THE HeroSection SHALL display the BackgroundImage as a full-screen background.
2. THE HeroSection SHALL render the GradientOverlay on top of the BackgroundImage.
3. THE HeroSection SHALL display the Logo image centered horizontally.
4. THE HeroSection SHALL display the HeraldBranding wordmark below the Logo.
5. THE HeroSection SHALL display the Tagline text below the HeraldBranding.
6. THE Tagline text SHALL read "The Official Higher Education Student Publication of La Verdad Christian College, Inc."
7. THE HeroSection SHALL render all branding elements in white or light-colored text against the dark overlay.

---

### Requirement 3: Login and Sign Up Navigation

**User Story:** As a user on the welcome screen, I want to tap Login or Sign Up buttons, so that I can access my account or create a new one.

#### Acceptance Criteria

1. THE HeroSection SHALL display a LoginButton and a SignUpButton side by side below the branding content.
2. WHEN the LoginButton is tapped, THE AppNavigator SHALL navigate to the Login screen.
3. WHEN the SignUpButton is tapped, THE AppNavigator SHALL navigate to the Register screen.
4. THE LoginButton and SignUpButton SHALL be visually distinct from each other (e.g., filled vs. outlined styles).

---

### Requirement 4: Latest Articles Section

**User Story:** As a user on the welcome screen, I want to see the latest published articles, so that I can preview content before deciding to log in.

#### Acceptance Criteria

1. THE WelcomeScreen SHALL display a LatestArticlesSection below the HeroSection.
2. WHEN the LatestArticlesSection loads, THE WelcomeScreen SHALL fetch the most recent articles from the articles API endpoint.
3. THE LatestArticlesSection SHALL render each article using the ArticleCard component.
4. WHEN an ArticleCard is tapped, THE AppNavigator SHALL navigate to the ArticleDetail screen passing the article's `id` and `slug`.
5. WHILE articles are loading, THE WelcomeScreen SHALL display a loading indicator in the LatestArticlesSection.
6. IF the articles API request fails, THEN THE WelcomeScreen SHALL display an error message in the LatestArticlesSection.
7. THE LatestArticlesSection SHALL display a section heading (e.g., "Latest Articles") above the article list.

---

### Requirement 5: Scrollable Layout

**User Story:** As a user on the welcome screen, I want to scroll through the full page content, so that I can view both the hero and the latest articles.

#### Acceptance Criteria

1. THE WelcomeScreen SHALL render the HeroSection and LatestArticlesSection within a vertically scrollable container.
2. THE HeroSection SHALL have a minimum height equal to the full screen height so it fills the viewport on initial load.
3. WHEN the user scrolls down, THE LatestArticlesSection SHALL be revealed below the HeroSection.

---

### Requirement 6: Asset Availability

**User Story:** As a developer integrating the WelcomeScreen, I want the required image assets to be present in the mobile assets directory, so that the screen renders correctly.

#### Acceptance Criteria

1. THE WelcomeScreen SHALL reference `bg.jpg` from the mobile assets directory.
2. THE WelcomeScreen SHALL reference `logo.svg` from the mobile assets directory (already present at `mobile/assets/logo.svg`).
3. WHERE the `la verdad herald.svg` asset is not present in the mobile assets directory, THE WelcomeScreen SHALL render the publication name as styled text as a fallback.
