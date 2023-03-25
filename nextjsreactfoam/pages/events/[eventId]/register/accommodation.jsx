import React from "react";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { FormProvider, useForm } from "react-hook-form";
import queryString from "query-string";
import SanitizedHTML from "react-sanitized-html";
import EventRegistrationAccommodationForm from "@/components/forms/EventRegistrationAccommodationForm";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import Alert from "@/components/ui/Alert";
import Wizard from "@/components/ui/Wizard2";
import useEventRegistrationDispatches from "@/hooks/useEventRegistrationDispatches";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import {
  withAuthUser,
  withEventAndAddonPages,
  withTenant,
} from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";

const RegistrationAccommodationPage = ({
  eventUserAccommodations,
  accommodationCosts,
  hotels,
  hotelFilters,
  authUser,
  event,
  tenant,
}) => {
  const methods = useForm();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const eventRegistrationSteps = getSteps(event, authUser);

  useEventRegistrationDispatches({ authUser, event, tenant });

  return (
    <FormProvider {...methods}>
      <Wizard
        skippable
        steps={eventRegistrationSteps}
        onNext={({ redirectToNextStep }) => redirectToNextStep()}
      >
        {!!!event?.is_standard_accommodation_open && (
          <Alert color="warning">Standard accommodations is closed.</Alert>
        )}
        {!!!event?.is_wotif_accommodation_open && (
          <Alert color="warning">Wotif accommodations is closed.</Alert>
        )}
        {!!event?.accommodation_text && (
          <div className="mb-4">
            <SanitizedHTML html={event?.accommodation_text} />
          </div>
        )}
        <EventRegistrationAccommodationForm
          event={event}
          hotels={hotels}
          hotelFilters={hotelFilters}
          accommodations={eventUserAccommodations}
          costs={accommodationCosts}
        />
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withAuthUser, withEventAndAddonPages, withTenant])(
    async (context, pipeProps) => {
      const session = await getSession(context);
      const urlQueryString = queryString.parse(context.req.url.split("?")[1]);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const eventUserAccommmodationsResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_USER_ACCOMMODATIONS, {
            query: {
              user: pipeProps.authUser.id,
              event: pipeProps.event.id,
              include: "eventAccommodationCost,sharingPartners",
            },
          }),
        });

        const accommodationCostsResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_ACCOMMODATION_COSTS, {
            eventId: pipeProps.event.id,
            query: {
              forUser: pipeProps.authUser.id,
              include:
                "eventAccommodationRoom,eventAccommodationRoom.accommodationRoom,eventAccommodationRoom.accommodationRoom.accommodation",
            },
          }),
        });

        const wotifHotelsResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_WOTIF_HOTELS, {
            eventId: pipeProps.event.id,
            query: urlQueryString,
          }),
        });

        const wotifFiltersResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_WOTIF_HOTEL_FILTERS, {
            eventId: pipeProps.event.id,
          }),
        });

        return {
          props: {
            session,
            ...pipeProps,
            accommodationCosts: accommodationCostsResponse.data.data,
            eventUserAccommodations: eventUserAccommmodationsResponse.data.data,
            hotels: wotifHotelsResponse.data?.data?.hotels,
            hotelFilters: wotifFiltersResponse.data,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

RegistrationAccommodationPage.authorized = true;
RegistrationAccommodationPage.Layout = RegistrationLayout;

export default RegistrationAccommodationPage;
