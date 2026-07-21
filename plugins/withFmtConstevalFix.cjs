const { withPodfile } = require('@expo/config-plugins');

// Xcode 26's stricter C++20 consteval enforcement breaks the version of the
// `fmt` library vendored by React Native/Folly. fmt's header conditionally
// `#define`s FMT_USE_CONSTEVAL 1 for Apple Clang, so a compiler flag alone
// can't override it. This plugin patches the generated Podfile's post_install
// hook to rewrite that define to 0 directly in the installed fmt header
// after `pod install`, which falls back fmt to runtime format-string
// validation and avoids the consteval build errors. Safe/idempotent — a
// no-op if fmt isn't present or already patched.
// https://github.com/facebook/react-native/issues/55601
// https://github.com/fmtlib/fmt/issues/4740
const withFmtConstevalFix = (config) => {
  return withPodfile(config, (config) => {
    const rubySnippet = `
    fmt_pod_dir = installer.sandbox.pod_dir('fmt')
    if fmt_pod_dir
      Dir.glob(File.join(fmt_pod_dir, '**', '*.h')).each do |header_path|
        contents = File.read(header_path)
        patched = contents.gsub(/#\\s*define\\s+FMT_USE_CONSTEVAL\\s+1\\b/, '#define FMT_USE_CONSTEVAL 0')
        File.write(header_path, patched) if patched != contents
      end
    end
`;

    if (config.modResults.contents.includes('FMT_USE_CONSTEVAL')) {
      return config;
    }

    const postInstallCallPattern = /react_native_post_install\([^)]*\)/;
    const match = config.modResults.contents.match(postInstallCallPattern);

    if (!match) {
      throw new Error(
        'withFmtConstevalFix: could not find react_native_post_install(...) call in generated Podfile'
      );
    }

    config.modResults.contents = config.modResults.contents.replace(
      postInstallCallPattern,
      `${match[0]}\n${rubySnippet}`
    );

    return config;
  });
};

module.exports = withFmtConstevalFix;
