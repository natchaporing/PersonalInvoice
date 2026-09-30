// Ghostscript prefix file for PDF/A output: document title and an sRGB output intent.
// The title and ICC profile path placeholders are filled in by pdfa.ts.
export const PDFA_PREFIX = String.raw`%!
% Prefix file for Ghostscript's PDF/A output: document title and an sRGB output intent.
% The title text and the sRGB ICC profile path are filled in by pdfa.ts.

[ /Title (__TITLE__) /DOCINFO pdfmark

/ICCProfile (__ICC__) def

[/_objdef {icc_PDFA} /type /stream /OBJ pdfmark
[{icc_PDFA} << /N 3 >> /PUT pdfmark
[{icc_PDFA} {ICCProfile (r) file} stopped
{
  (\nCould not read the sRGB ICC profile; PDF/A processing aborted.\n) print
  cleartomark
}
{
  /PUT pdfmark
  [/_objdef {OutputIntent_PDFA} /type /dict /OBJ pdfmark
  [{OutputIntent_PDFA} <<
    /Type /OutputIntent
    /S /GTS_PDFA1
    /DestOutputProfile {icc_PDFA}
    /OutputConditionIdentifier (sRGB)
  >> /PUT pdfmark
  [{Catalog} << /OutputIntents [ {OutputIntent_PDFA} ] >> /PUT pdfmark
} ifelse
`;
