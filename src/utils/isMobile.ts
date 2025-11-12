export const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  )

export default isMobileDevice

