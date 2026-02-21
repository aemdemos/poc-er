/**
 * Metadata block - processes page metadata and hides itself.
 * Metadata is already extracted by aem.js during page load.
 * This block simply ensures its container is not visible.
 */
export default function decorate(block) {
  const section = block.closest('.section');
  if (section) {
    section.remove();
  }
}
