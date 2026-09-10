package com.example.bffkickstart.repositories;

import com.example.bffkickstart.models.InspectionAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface InspectionAttachmentRepository extends JpaRepository<InspectionAttachment, Long> {

    /**
     * Interface projection so list views never pull the BLOB column - Spring Data
     * generates a select of exactly these properties.
     */
    interface InspectionAttachmentSummary {
        Long getId();

        String getFilename();

        String getContentType();

        long getSizeBytes();

        String getUploadedBy();

        Instant getUploadedAt();
    }

    List<InspectionAttachmentSummary> findByInspectionIdOrderByUploadedAtDesc(Long inspectionId);

    Optional<InspectionAttachment> findByIdAndInspectionId(Long id, Long inspectionId);
}
