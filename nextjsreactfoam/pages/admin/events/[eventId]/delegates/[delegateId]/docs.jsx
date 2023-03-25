import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Panel from "@/components/ui/Panel";
import actionTypes from "@/contexts/action-types";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import { useEventDispatch } from "@/contexts/EventContext";
import paths from "@/routes/paths";
import getContextProps from "@/utils/getContextProps";
import { useEventState } from "@/contexts/EventContext";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import { useSession } from "next-auth/client";
import fileDownload from "js-file-download";

const DelegatesDocs = ({ event, registration, session }) => {
  const [sessionToken] = useSession();
  const { addToast } = useToasts();

  const t = useTranslations();

  const eventDispatch = useEventDispatch();

  const onSubmit = async (document, type) => {
    try {
      const response = await api({
        method: "GET",
        responseType: "blob",
        url: `/events/${event.id}/delegates/documents`,
        params: {
          document: document,
          registration: registration.id,
          type: type,
        },
        headers: {
          "X-Tenant": getTenant(),
          Authorization: `Bearer ${sessionToken.accessToken}`,
        },
      });
      fileDownload(new Blob([response.data]), `${document}_.${type}`);
    } catch (e) {
      addToast("Failed to download Document", {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  const dropdownOptions = (type) => {
    return [
      {
        label: "PDF",
        onClick: () => {
          onSubmit(type, "pdf");
        },
      },
      {
        label: "HTML",
        onClick: () => {
          onSubmit(type, "html");
        },
      },
    ];
  };

  /**
   * Sets the delegate to be used for the entire delegate-related pages.
   * This must be implemented in every delegate page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_REGISTRATION,
      payload: registration,
    });
  }, [registration]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Docs" />

      <Panel title="Documents" color="inverse" maximizable collapsable>
        <div className="detail-section-wrapper">
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Invoice</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Full Invoice</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Certificate of Attendance</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Name Badge</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Tickets</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Registration Summary</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("registration_summary")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("registration_summary", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Registration Summary (No Cost Information)</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Accommodation Only Invoice</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Registration & Addons Only Invoice</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("invoice")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("invoice", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center b-1 p-15 m-b-15">
                <p>Visa Letter</p>
                <Button.Dropdown
                  className=" mr-4"
                  options={dropdownOptions("visa_letter")}
                >
                  <Button
                    onClick={() => {
                      onSubmit("visa_letter", "pdf");
                    }}
                  >
                    Download
                  </Button>
                </Button.Dropdown>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });
      const registrationResponse = await api({
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          registration: registrationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    props: {},
  };
};

DelegatesDocs.Layout = ViewDelegateLayout;

export default DelegatesDocs;
