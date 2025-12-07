import React from "react";
import {FormattedMessage} from "react-intl";

export default function UploadModal({
                                        uploadModalRef,
                                        fileInputRef,
                                        previewUrl,
                                        uploadMode,
                                        setUploadMode,
                                        handleFileSelected,
                                        handleCancelUpload,
                                        handleConfirmUpload
                                    }) {
    return (
        <div
            ref={uploadModalRef}
            className="modal fade"
            tabIndex="-1"
            aria-labelledby="uploadModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">

                    {/* Title */}
                    <div className="modal-header">
                        <h5 className="modal-title" id="uploadModalLabel">
                            <FormattedMessage id="alert.imageUploadTitle"/>
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={handleCancelUpload}
                        ></button>
                    </div>

                    {/* Upload + Preview */}
                    <div className="modal-body">
                        <div className="text-center mb-3">
                            <label className="form-label">
                                <FormattedMessage id="alert.enterFile"/>
                            </label>

                            <div
                                className="upload-drop-zone"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{maxWidth: "100%", maxHeight: "200px"}}
                                    />
                                ) : (
                                    <div>
                                        <i className="fas fa-cloud-upload-alt fa-2x mb-2"></i>
                                        <small className="text-muted">
                                            <FormattedMessage id="alert.imageUploadText"/>
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="d-none"
                            onChange={handleFileSelected}
                        />

                        {/* Scale Options */}
                        <div className="mt-4">
                            <label className="form-label d-block mb-3">
                                <strong>
                                    <FormattedMessage id="alert.scale"/>
                                </strong>
                            </label>

                            <div className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="scaleWhole"
                                    name="scaleMode"
                                    value="scale"
                                    checked={uploadMode === "scale"}
                                    onChange={(e) => setUploadMode(e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="scaleWhole">
                                    <FormattedMessage id="alert.scale"/>
                                </label>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="shrinkMode"
                                    name="scaleMode"
                                    value="shrink"
                                    checked={uploadMode === "shrink"}
                                    onChange={(e) => setUploadMode(e.target.value)}
                                />
                                <label className="form-check-label" htmlFor="shrinkMode">
                                    <FormattedMessage id="alert.shrink"/>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancelUpload}
                        >
                            <FormattedMessage id="alert.cancelButton"/>
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleConfirmUpload}
                            disabled={!previewUrl}
                        >
                            <FormattedMessage id="alert.saveButton"/>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}