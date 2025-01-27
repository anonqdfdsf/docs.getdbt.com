/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, {useState, useCallback, useContext, useEffect} from 'react';
import {MDXProvider} from '@mdx-js/react';
import renderRoutes from '@docusaurus/renderRoutes';
import Layout from '@theme/Layout';
import DocSidebar from '@theme/DocSidebar';
import MDXComponents from '@theme/MDXComponents';
import NotFound from '@theme/NotFound';
import IconArrow from '@theme/IconArrow';
import BackToTopButton from '@theme/BackToTopButton';
import {matchPath} from '@docusaurus/router';
import {translate} from '@docusaurus/Translate';
import clsx from 'clsx';
import styles from './styles.module.css';
import {
  ThemeClassNames,
  docVersionSearchTag,
  DocsSidebarProvider,
  useDocsSidebar,
  DocsVersionProvider,
} from '@docusaurus/theme-common';
import Head from '@docusaurus/Head';
import Admonition from '@theme/Admonition';
import {usePluginData} from '@docusaurus/useGlobalData';
import VersionContext from '../../stores/VersionContext'
import pageVersionCheck from '../../utils/page-version-check';

function DocPageContent({
  currentDocRoute,
  versionMetadata,
  children,
  sidebarName,
}) {
  const sidebar = useDocsSidebar();
  const {pluginId, version} = versionMetadata;
  const [hiddenSidebarContainer, setHiddenSidebarContainer] = useState(false);
  const [hiddenSidebar, setHiddenSidebar] = useState(false);
  const toggleSidebar = useCallback(() => {
    if (hiddenSidebar) {
      setHiddenSidebar(false);
    }

    setHiddenSidebarContainer((value) => !value);
  }, [hiddenSidebar]);

  // Check if page available for current version
  const { versionedPages } = usePluginData('docusaurus-build-global-data-plugin');
  const { version: dbtVersion, EOLDate, isPrerelease, latestStableRelease } = useContext(VersionContext)
  const { pageAvailable, firstAvailableVersion } = pageVersionCheck(dbtVersion, versionedPages, currentDocRoute.path)

  // Check whether this version is a isPrerelease, and show banner if so
  const [PreData, setPreData] = useState({
    showisPrereleaseBanner: false,
    isPrereleaseBannerText: ''
  })

  // Check End of Life date and show unsupported banner if deprecated version
  const [EOLData, setEOLData] = useState({
    showEOLBanner: false,
    EOLBannerText: ''
  })

  useEffect(() => {
    // If version is not isPrerelease, do not show banner
    if(!isPrerelease) {
      setPreData({
        showisPrereleaseBanner: false,
        isPrereleaseBannerText: ''
      })
    } else {
        setPreData({
          showisPrereleaseBanner: true,
          isPrereleaseBannerText  : `You are currently viewing v${dbtVersion}, which is a prerelease of dbt Core. The latest stable version is v${latestStableRelease}`
        })
    }
    // If EOLDate not set for version, do not show banner
    if(!EOLDate) {
      setEOLData({
        showEOLBanner: false,
        EOLBannerText: ''
      })
    } else {
      let threeMonths = new Date(EOLDate)
      threeMonths.setMonth(threeMonths.getMonth() - 3)
      if(new Date() > new Date(EOLDate)) {
        setEOLData({
          showEOLBanner: true,
          EOLBannerText: `This version of dbt Core is <a href="/docs/core-versions">no longer supported</a>. No patch releases will be made, even for critical security issues. For better performance, improved security, and new features, you should upgrade to ${latestStableRelease}, the latest stable version.`
        })
      } else if(new Date() > threeMonths) {
        setEOLData({
          showEOLBanner: true,
          EOLBannerText: `This version of dbt Core is nearing the end of its <a href="/docs/core-versions">critical support period</a>. For better performance, improved security, and new features, you should upgrade to ${latestStableRelease}, the latest stable version.`
        })
      } else {
        setEOLData({
          showEOLBanner: false,
          EOLBannerText: ''
        })
      }
    }
  }, [dbtVersion])

  return (
    <Layout
      wrapperClassName={ThemeClassNames.wrapper.docsPages}
      pageClassName={ThemeClassNames.page.docsDocPage}
      searchMetadata={{
        version,
        tag: docVersionSearchTag(pluginId, version),
      }}>
      <div className={styles.docPage}>
        <BackToTopButton />

        {sidebar && (
          <aside
            className={clsx(styles.docSidebarContainer, {
              [styles.docSidebarContainerHidden]: hiddenSidebarContainer,
            })}
            onTransitionEnd={(e) => {
              if (
                !e.currentTarget.classList.contains(styles.docSidebarContainer)
              ) {
                return;
              }

              if (hiddenSidebarContainer) {
                setHiddenSidebar(true);
              }
            }}>
            <DocSidebar
              key={
                // Reset sidebar state on sidebar changes
                // See https://github.com/facebook/docusaurus/issues/3414
                sidebarName
              }
              sidebar={sidebar}
              path={currentDocRoute.path}
              onCollapse={toggleSidebar}
              isHidden={hiddenSidebar}
            />

            {hiddenSidebar && (
              <div
                className={styles.collapsedDocSidebar}
                title={translate({
                  id: 'theme.docs.sidebar.expandButtonTitle',
                  message: 'Expand sidebar',
                  description:
                    'The ARIA label and title attribute for expand button of doc sidebar',
                })}
                aria-label={translate({
                  id: 'theme.docs.sidebar.expandButtonAriaLabel',
                  message: 'Expand sidebar',
                  description:
                    'The ARIA label and title attribute for expand button of doc sidebar',
                })}
                tabIndex={0}
                role="button"
                onKeyDown={toggleSidebar}
                onClick={toggleSidebar}>
                <IconArrow className={styles.expandSidebarButtonIcon} />
              </div>
            )}
          </aside>
        )}
        <main
          className={clsx(styles.docMainContainer, {
            [styles.docMainContainerEnhanced]:
              hiddenSidebarContainer || !sidebar,
          })}>
          <div
            className={clsx(
              'container padding-top--md padding-bottom--lg',
              styles.docItemWrapper,
              {
                [styles.docItemWrapperEnhanced]: hiddenSidebarContainer,
              },
            )}>
            {!pageAvailable && dbtVersion && firstAvailableVersion && (
              <div className={styles.versionBanner}>
                <Admonition type="caution" title={`New feature!`} icon="🎉 " >
                  <p style={{'marginTop': '5px', 'marginBottom': '0'}}>Unfortunately, this feature is not available in dbt Core version {dbtVersion}</p>
                  <p> You should upgrade to {firstAvailableVersion} or later if you want to use this feature.</p>
                </Admonition>
              </div>
            )}
            {PreData.showisPrereleaseBanner && (
              <div className={styles.versionBanner}>
                <Admonition type="caution" title="Warning">
                  <div dangerouslySetInnerHTML={{__html: PreData.isPrereleaseBannerText}} />
                </Admonition>
              </div>
            )}
            {EOLData.showEOLBanner && (
              <div className={styles.versionBanner}>
                <Admonition type="caution" title="Warning">
                  <div dangerouslySetInnerHTML={{__html: EOLData.EOLBannerText}} />
                </Admonition>
              </div>
            )}
            <MDXProvider components={MDXComponents}>{children}</MDXProvider>
          </div>
        </main>
      </div>
    </Layout>
  );
}

function DocPage(props) {
  const {
    route: {routes: docRoutes},
    versionMetadata,
    location,
  } = props;
  const currentDocRoute = docRoutes.find((docRoute) =>
    matchPath(location.pathname, docRoute),
  );

  if (!currentDocRoute) {
    return <NotFound />;
  } // For now, the sidebarName is added as route config: not ideal!

  const sidebarName = currentDocRoute.sidebar;
  const sidebar = sidebarName
    ? versionMetadata.docsSidebars[sidebarName]
    : null;
  return (
    <>
      <Head>
        {/* TODO we should add a core addRoute({htmlClassName}) generic plugin option */}
        <html className={versionMetadata.className} />
      </Head>
      <DocsVersionProvider version={versionMetadata}>
        <DocsSidebarProvider sidebar={sidebar}>
          <DocPageContent
            currentDocRoute={currentDocRoute}
            versionMetadata={versionMetadata}
            sidebarName={sidebarName}>
            {renderRoutes(docRoutes, {
              versionMetadata,
            })}
          </DocPageContent>
        </DocsSidebarProvider>
      </DocsVersionProvider>
    </>
  );
}

export default DocPage;
