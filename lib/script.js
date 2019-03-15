/**
 * Transaktion um eine Inspektion durchzuführen
 * @param {org.serviceheft.inspektion.InspektionDurchfuehren} inspektionsDaten
 * @transaction
 */

function inspektionDurchfuehren(inspektionsDaten) {
    return getAssetRegistry('org.serviceheft.fahrzeug.Fahrzeug')
        .then(function (fahrzeugRegistry) {
            return fahrzeugRegistry.get(inspektionsDaten.fahrzeug.getIdentifier());
        })
        .then(function (fahrzeug) {
            if (!fahrzeug) throw new Error("Das Fahrzeug mir der ID: " + inspektionsDaten.fahrzeug.getIdentifier() + " wurde nicht in der Blockchain gefunden!");
            return getAssetRegistry('org.serviceheft.inspektion.Inspektion')
        })
        .then(
            function (inspektionRegistry) {
                var factory = getFactory();
                var NS = 'org.serviceheft.inspektion';

                var inspektion = factory.newResource(NS, 'Inspektion', inspektionsDaten.inspektionNr);
                inspektion.fahrzeug = inspektionsDaten.fahrzeug;
                inspektion.werkstatt = factory.newRelationship('org.serviceheft.teilnehmer', "Werkstatt",  getCurrentParticipant().getIdentifier());
                inspektion.datum = inspektionsDaten.datum;
                inspektion.bearbeiter = inspektionsDaten.bearbeiter;
                inspektion.istUnterschrieben = false;

                inspektionsDaten.materialien.forEach(element => {
                    var material = factory.newConcept(NS, "Material");
                    material.materialNr = element.materialNr;
                    material.bezeichnung = element.bezeichnung;
                    material.menge = element.menge;
                    inspektion.addArrayValue("materialien", material);
                });

                inspektionsDaten.dienstleistungen.forEach(element => {
                    var dienstleistung = factory.newConcept(NS, "Dienstleistung");
                    dienstleistung.dienstleistungNr = element.dienstleistungNr;
                    dienstleistung.bezeichnung = element.bezeichnung;
                    dienstleistung.menge = element.menge;
                    inspektion.addArrayValue("dienstleistungen", dienstleistung);
                });

                return inspektionRegistry.add(inspektion);
            }
        );
}

/**
 * Transaktion, um eine Digitale Unterschrift zu setzen
 * @param {org.serviceheft.inspektion.DigitaleUnterschriftSetzen} unterschriftDaten
 * @transaction
 */
function digitaleUnterschriftSetzen(unterschriftDaten) {
    inspektionRegistry = {};
    return getAssetRegistry('org.serviceheft.inspektion.Inspektion')
        .then(function (registry) {
            inspektionRegistry = registry;
            return inspektionRegistry.get(unterschriftDaten.inspektion.getIdentifier()); // eventuell falsch, da komplett und nicht nur id
        })
        .then(function (inspektion) {
            inspektion.istUnterschrieben = unterschriftDaten.unterschrift;
            return inspektionRegistry.update(inspektion);
        })
        .catch(function (error) {
            throw new Error(error);
        });
}