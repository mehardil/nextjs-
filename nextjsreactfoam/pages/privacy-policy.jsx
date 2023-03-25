import React from "react";

export default () => <div>Under Maintenance</div>;

export const getServerSideProps = async (context) => {
  return {
    props: {},
  };
};
