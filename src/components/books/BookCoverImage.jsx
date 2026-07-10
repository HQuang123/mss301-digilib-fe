import { useEffect, useState } from 'react'

function BookCoverImage({ src, alt, className, fallback }) {
  const sources = Array.isArray(src) ? src.filter(Boolean) : [src].filter(Boolean)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setCurrentIndex(0)
  }, [src])

  if (sources.length === 0 || currentIndex >= sources.length) {
    return fallback
  }

  return (
    <img
      src={sources[currentIndex]}
      alt={alt}
      className={className}
      onError={() => setCurrentIndex((index) => index + 1)}
    />
  )
}

export default BookCoverImage
