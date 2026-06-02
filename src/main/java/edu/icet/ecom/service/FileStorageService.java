package edu.icet.ecom.service;

import edu.icet.ecom.exception.FileStorageException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.regex.Pattern;

@Service
public class    FileStorageService {

    private static final Pattern INVALID_FILE_CHARS = Pattern.compile("[\\\\/:*?\"<>|]");

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public FileStorageService() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new FileStorageException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String fileName = StringUtils.cleanPath(originalFileName == null ? "file" : originalFileName);
        fileName = INVALID_FILE_CHARS.matcher(fileName).replaceAll("_").trim();
        if (fileName.isBlank() || ".".equals(fileName) || "..".equals(fileName)) {
            fileName = "file";
        }

        try {
            String newFileName = System.currentTimeMillis() + "_" + fileName;
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new FileStorageException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }
}