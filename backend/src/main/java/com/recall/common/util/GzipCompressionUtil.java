package com.recall.common.util;

import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

/**
 * GzipCompressionUtil
 * 
 * Provides high-performance string and byte compression using Java's built-in GZIP.
 * Plain text/markdown/code shrinks by 70% to 85%, dramatically reducing storage
 * requirements for the Claim-Check pattern.
 */
@Slf4j
public final class GzipCompressionUtil {

    private GzipCompressionUtil() {
        // Utility class
    }

    /**
     * Compresses a UTF-8 string into GZIP-compressed bytes.
     */
    public static byte[] compress(String content) {
        if (content == null || content.isEmpty()) {
            return new byte[0];
        }
        return compressBytes(content.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Compresses raw bytes into GZIP-compressed bytes.
     */
    public static byte[] compressBytes(byte[] rawData) {
        if (rawData == null || rawData.length == 0) {
            return new byte[0];
        }

        try (ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
             GZIPOutputStream gzipStream = new GZIPOutputStream(byteStream)) {

            gzipStream.write(rawData);
            gzipStream.finish();

            byte[] compressed = byteStream.toByteArray();
            double savings = 100.0 * (1.0 - ((double) compressed.length / (double) rawData.length));
            log.debug("GZIP Compressed: {} bytes -> {} bytes ({.1f}% reduction)", 
                    rawData.length, compressed.length, savings);

            return compressed;
        } catch (IOException e) {
            log.error("Failed to compress data with GZIP", e);
            throw new RuntimeException("GZIP compression error: " + e.getMessage(), e);
        }
    }

    /**
     * Decompresses GZIP-compressed bytes back into a UTF-8 String.
     */
    public static String decompress(byte[] compressedBytes) {
        if (compressedBytes == null || compressedBytes.length == 0) {
            return "";
        }
        byte[] decompressed = decompressBytes(compressedBytes);
        return new String(decompressed, StandardCharsets.UTF_8);
    }

    /**
     * Decompresses GZIP-compressed bytes back into raw uncompressed bytes.
     */
    public static byte[] decompressBytes(byte[] compressedBytes) {
        if (compressedBytes == null || compressedBytes.length == 0) {
            return new byte[0];
        }

        try (ByteArrayInputStream byteStream = new ByteArrayInputStream(compressedBytes);
             GZIPInputStream gzipStream = new GZIPInputStream(byteStream);
             ByteArrayOutputStream outStream = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = gzipStream.read(buffer)) != -1) {
                outStream.write(buffer, 0, bytesRead);
            }

            return outStream.toByteArray();
        } catch (IOException e) {
            log.error("Failed to decompress GZIP bytes", e);
            throw new RuntimeException("GZIP decompression error: " + e.getMessage(), e);
        }
    }

    /**
     * Calculates reduction percentage for logging and telemetry.
     */
    public static double calculateSavingsPercentage(long rawBytes, long compressedBytes) {
        if (rawBytes <= 0) return 0.0;
        return Math.max(0.0, 100.0 * (1.0 - ((double) compressedBytes / (double) rawBytes)));
    }
}
