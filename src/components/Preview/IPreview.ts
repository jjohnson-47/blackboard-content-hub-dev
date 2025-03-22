import { EditorContent } from '../Editor/IEditor';

/**
 * Device size type
 */
export enum DeviceSize {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

/**
 * Preview interface
 */
export interface IPreview {
  /**
   * Update preview content
   * @param content Content to display
   */
  update(content: EditorContent): void;
  
  /**
   * Set preview device size
   * @param size Device size
   */
  setDeviceSize(size: DeviceSize): void;
  
  /**
   * Get preview iframe element
   * @returns HTMLIFrameElement
   */
  getIframe(): HTMLIFrameElement;
}