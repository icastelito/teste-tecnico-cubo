import { useEffect } from "react";
import type { ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
}

export const Modal = ({ isOpen, onClose, title, children, size = "md" }: ModalProps) => {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className={`modal modal--${size}`} onClick={(e) => e.stopPropagation()}>
				{title && (
					<div className="modal-header">
						<h2>{title}</h2>
						<button className="modal-close" onClick={onClose}>
							✕
						</button>
					</div>
				)}
				<div className="modal-content">{children}</div>
			</div>
		</div>
	);
};
