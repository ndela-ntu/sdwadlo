import React from "react";

interface DividerProps {
  thickness?: string;
  width?: string;
  margin?: string;
  className?: string;
}

const Divider: React.FC<DividerProps> = ({
  thickness = "2px",
  width = "100%",
  margin = "1rem 0",
  className = "",
}) => {
  return (
    <hr
      className={className}
      style={{
        backgroundColor: "black",
        height: thickness,
        width: width,
        margin: margin,
        border: "none",
      }}
    />
  );
};

export default Divider;
