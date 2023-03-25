import React from "react";
import OrganisationReportHeader from "@/components/common/OrganisationReportHeader";

export default () => <div>Under Maintenance</div>;

export const getServerSideProps = async (context) => {
  return {
    props: {},
  };
};
