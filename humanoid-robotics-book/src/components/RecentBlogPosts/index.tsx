import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useGlobalData from '@docusaurus/useGlobalData';
import Heading from '@theme/Heading';

export default function RecentBlogPosts(): JSX.Element | null {
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();

  const blogPluginData = useGlobalData()['docusaurus-plugin-content-blog'];
  const allBlogPosts = blogPluginData?.blogPosts;

  if (!allBlogPosts || allBlogPosts.length === 0) {
    return null;
  }

  // Sort posts by date (most recent first) and get the top N
  const recentPosts = allBlogPosts
    .sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime())
    .slice(0, 3); // Display top 3 recent posts

  if (recentPosts.length === 0) {
    return null;
  }

  return (
    <section style={{ margin: '3rem 0' }}>
      <div className="container">
        <Heading as="h2" className="text--center">
          Recent Blog Posts
        </Heading>
        <div className="row">
          {recentPosts.map(({ metadata: { permalink, title, description } }) => (
            <article key={permalink} className="col col--4 margin-bottom--lg">
              <Link to={permalink} className="card padding--lg">
                <Heading as="h3">{title}</Heading>
                <p>{description}</p>
              </Link>
            </article>
          ))}
        </div>
        <div className="text--center">
          <Link to="/blog" className="button button--primary">
            View All Posts
          </Link>
        </div>
      </div>
    </section>
  );
}