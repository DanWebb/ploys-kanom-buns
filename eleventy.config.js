import pluginWebc from '@11ty/eleventy-plugin-webc';
import browserslist from 'browserslist';
import { transform, browserslistToTargets } from 'lightningcss';

async function transformCSS(content) {
  if (this.type !== 'css') {
    return content;
  }

  const targets = browserslistToTargets(browserslist('> 0.25% and not dead'));
  const { code } = transform({
    code: Buffer.from(content),
    minify: true,
    sourceMap: false,
    targets,
  });

  return code;
}


export default function (eleventyConfig) {
	eleventyConfig.addPlugin(pluginWebc, {
		components: 'src/components/**/*.webc',
    bundlePluginOptions: {
      transforms: [transformCSS],
    },
  });

  eleventyConfig.addWatchTarget('src/styles/*.css');
  eleventyConfig.addPassthroughCopy('src/assets');

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: 'components',
      layouts: 'layouts',
      data: 'data',
    },
  }
}