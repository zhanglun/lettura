import React from "react";
import styles from "./loading.css";

export const Loading = () => {
	return (
		<div className={styles.spinner}>
			<div className={styles["double-bounce1"]} />
			<div className={styles["double-bounce2"]} />
		</div>
	);
};
