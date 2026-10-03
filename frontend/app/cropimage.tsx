// src/utils/getCroppedPerspectiveImg.ts
export const getCroppedPerspectiveImg = async (
  imageSrc: string,
  points: { x: number; y: number }[]
): Promise<File> => {
  return new Promise(async (resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = imageSrc;

    await new Promise((res) => (image.onload = res));

    // Create canvas to draw the final output
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Load OpenCV image
    const srcMat = cv.imread(image);

    // Source points: user-dragged corners
    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      points[0].x, points[0].y,
      points[1].x, points[1].y,
      points[2].x, points[2].y,
      points[3].x, points[3].y,
    ]);

    // Calculate output dimensions (width/height based on corners)
    const widthTop = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    const widthBottom = Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y);
    const maxWidth = Math.max(widthTop, widthBottom);

    const heightLeft = Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y);
    const heightRight = Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y);
    const maxHeight = Math.max(heightLeft, heightRight);

    // Destination points: final rect
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      maxWidth, 0,
      maxWidth, maxHeight,
      0, maxHeight,
    ]);

    // Get perspective transform
    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    const dstMat = new cv.Mat();

    // Warp image
    cv.warpPerspective(srcMat, dstMat, M, new cv.Size(maxWidth, maxHeight));

    // Draw to canvas
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    cv.imshow(canvas, dstMat);

    // Convert canvas to file
    canvas.toBlob((blob) => {
      if (!blob) {
        reject("Failed to create blob.");
        return;
      }
      resolve(new File([blob], "scanned.jpg", { type: "image/jpeg" }));
    }, "image/jpeg");

    // Clean up
    srcMat.delete(); dstMat.delete(); srcPts.delete(); dstPts.delete(); M.delete();
  });
};
export default getCroppedPerspectiveImg;