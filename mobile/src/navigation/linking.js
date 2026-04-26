// Deep linking configuration for La Verdad Herald
export const linking = {
  prefixes: [
    'laverdadherald://',
    'https://laverdadherald.com',
    'https://your-backend-domain.com', // UPDATE THIS with your actual domain
  ],
  config: {
    screens: {
      // Main tabs
      Home: 'home',
      Explore: 'explore',
      PressHub: 'presshub',
      Profile: 'profile',
      
      // Article Stack
      ArticleStack: {
        screens: {
          ArticleDetail: 'article/:slug',
          TagArticles: 'tags/:tagName',
        },
      },
      
      // Auth Stack
      AuthStack: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          Register: 'register',
        },
      },
      
      // Management Stack (Admin)
      Management: {
        screens: {
          Admin: 'admin',
          CreateArticle: 'admin/create',
          EditArticle: 'admin/edit/:articleId',
        },
      },
    },
  },
};
