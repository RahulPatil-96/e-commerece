import { Helmet } from 'react-helmet-async';

/** @typedef {{ title?: string, description?: string, image?: string, canonical?: string }} PageMetaProps */

export default function PageMeta(/** @type {PageMetaProps} */ { title, description, image, canonical }) {
  const appTitle = 'Arihant Stationery';
  const fullTitle = title ? `${title} | ${appTitle}` : appTitle;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || 'Arihant Stationery — premium stationery and thoughtful gifting.'} />
      {image ? <meta property="og:image" content={image} /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}
    </Helmet>
  );
}
