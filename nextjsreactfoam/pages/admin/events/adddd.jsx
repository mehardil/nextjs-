import React from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import PageHeader from "@/components/common/PageHeader";
import EventSetupWizard from "@/components/forPage/EventSetupWizard";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { ADMIN } from "@/constants/roles";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const AddEvent = () => {
  return (
    <>
      <PageHeader title="Add Event" />
      <EventSetupWizard />
    </>
  );
};

export const getServerSideProps = async (context) => {
  return {
    props: {},
  };
};

AddEvent.authorized = true;
AddEvent.Layout = DashboardLayout;

export default AddEvent;
