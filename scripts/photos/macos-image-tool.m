#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <ImageIO/ImageIO.h>
#include <math.h>

static id Nullable(id value) {
    return value ?: [NSNull null];
}

static NSNumber *IntegerProperty(NSDictionary *properties, CFStringRef key) {
    id value = properties[(__bridge NSString *)key];
    return [value isKindOfClass:[NSNumber class]] ? value : nil;
}

static NSNumber *NumberProperty(NSDictionary *properties, CFStringRef key) {
    id value = properties[(__bridge NSString *)key];
    return [value isKindOfClass:[NSNumber class]] ? value : nil;
}

static NSString *StringProperty(NSDictionary *properties, CFStringRef key) {
    id value = properties[(__bridge NSString *)key];
    if ([value isKindOfClass:[NSString class]]) return value;
    return value ? [value description] : nil;
}

static NSDictionary *MetadataFlags(NSDictionary *properties) {
    NSDictionary *gps = properties[(__bridge NSString *)kCGImagePropertyGPSDictionary];
    NSDictionary *tiff = properties[(__bridge NSString *)kCGImagePropertyTIFFDictionary];
    NSDictionary *apple = properties[(__bridge NSString *)kCGImagePropertyMakerAppleDictionary];
    BOOL hasGps = [gps isKindOfClass:[NSDictionary class]] && gps.count > 0;
    BOOL hasDevice =
        StringProperty(tiff, kCGImagePropertyTIFFMake) != nil ||
        StringProperty(tiff, kCGImagePropertyTIFFModel) != nil ||
        StringProperty(tiff, kCGImagePropertyTIFFSoftware) != nil ||
        ([apple isKindOfClass:[NSDictionary class]] && apple.count > 0);
    return @{@"gps": @(hasGps), @"device": @(hasDevice)};
}

static NSDictionary *GPSCoordinates(NSDictionary *properties) {
    NSDictionary *gps = properties[(__bridge NSString *)kCGImagePropertyGPSDictionary];
    if (![gps isKindOfClass:[NSDictionary class]]) return nil;

    NSNumber *latitude = NumberProperty(gps, kCGImagePropertyGPSLatitude);
    NSNumber *longitude = NumberProperty(gps, kCGImagePropertyGPSLongitude);
    NSString *latitudeRef = StringProperty(gps, kCGImagePropertyGPSLatitudeRef);
    NSString *longitudeRef = StringProperty(gps, kCGImagePropertyGPSLongitudeRef);
    if (!latitude || !longitude) return nil;

    double latitudeValue = latitude.doubleValue;
    double longitudeValue = longitude.doubleValue;
    if (latitudeRef) {
        if ([latitudeRef caseInsensitiveCompare:@"N"] != NSOrderedSame &&
            [latitudeRef caseInsensitiveCompare:@"S"] != NSOrderedSame) return nil;
        latitudeValue = fabs(latitudeValue);
        if ([latitudeRef caseInsensitiveCompare:@"S"] == NSOrderedSame) latitudeValue *= -1;
    }
    if (longitudeRef) {
        if ([longitudeRef caseInsensitiveCompare:@"E"] != NSOrderedSame &&
            [longitudeRef caseInsensitiveCompare:@"W"] != NSOrderedSame) return nil;
        longitudeValue = fabs(longitudeValue);
        if ([longitudeRef caseInsensitiveCompare:@"W"] == NSOrderedSame) longitudeValue *= -1;
    }
    if (!isfinite(latitudeValue) || !isfinite(longitudeValue) ||
        latitudeValue > 90 || longitudeValue > 180) return nil;

    return @{ @"latitude": @(latitudeValue), @"longitude": @(longitudeValue) };
}

static NSDictionary *Failure(NSString *key, NSString *message) {
    return @{
        @"key": key,
        @"ok": @NO,
        @"error": message,
        @"formatIdentifier": [NSNull null],
        @"imageCount": [NSNull null],
        @"pixelWidth": [NSNull null],
        @"pixelHeight": [NSNull null],
        @"orientation": [NSNull null],
        @"orientedWidth": [NSNull null],
        @"orientedHeight": [NSNull null],
        @"colorModel": [NSNull null],
        @"profileName": [NSNull null],
        @"capture": [NSNull null],
        @"gpsPresent": [NSNull null],
        @"gpsCoordinates": [NSNull null],
        @"deviceMetadataPresent": [NSNull null],
        @"xmpPresent": [NSNull null],
        @"outputWidth": [NSNull null],
        @"outputHeight": [NSNull null],
        @"outputProfileName": [NSNull null],
        @"outputGpsPresent": [NSNull null],
        @"outputDeviceMetadataPresent": [NSNull null],
        @"outputSensitiveMetadata": [NSNull null]
    };
}

static NSDictionary *ProcessImage(NSDictionary *request) {
    NSString *key = request[@"key"];
    NSString *sourcePath = request[@"source"];
    NSString *outputPath = request[@"output"];
    NSNumber *maximum = request[@"maxPixelSize"];
    NSNumber *quality = request[@"quality"];
    if (![key isKindOfClass:[NSString class]] ||
        ![sourcePath isKindOfClass:[NSString class]] ||
        ![outputPath isKindOfClass:[NSString class]] ||
        ![maximum isKindOfClass:[NSNumber class]] ||
        ![quality isKindOfClass:[NSNumber class]]) {
        return Failure([key isKindOfClass:[NSString class]] ? key : @"unknown", @"Invalid image request.");
    }

    NSURL *sourceUrl = [NSURL fileURLWithPath:sourcePath];
    CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)sourceUrl, NULL);
    if (!source) return Failure(key, @"ImageIO could not open the source image.");

    NSDictionary *properties = CFBridgingRelease(CGImageSourceCopyPropertiesAtIndex(source, 0, NULL));
    if (![properties isKindOfClass:[NSDictionary class]]) {
        CFRelease(source);
        return Failure(key, @"ImageIO could not read the source image properties.");
    }

    NSNumber *width = IntegerProperty(properties, kCGImagePropertyPixelWidth);
    NSNumber *height = IntegerProperty(properties, kCGImagePropertyPixelHeight);
    NSNumber *orientation = IntegerProperty(properties, kCGImagePropertyOrientation) ?: @1;
    BOOL swapsAxes = [@[@5, @6, @7, @8] containsObject:orientation];
    NSNumber *orientedWidth = swapsAxes ? height : width;
    NSNumber *orientedHeight = swapsAxes ? width : height;
    NSDictionary *exif = properties[(__bridge NSString *)kCGImagePropertyExifDictionary];
    NSDictionary *tiff = properties[(__bridge NSString *)kCGImagePropertyTIFFDictionary];
    NSDictionary *flags = MetadataFlags(properties);
    NSDictionary *gpsCoordinates = GPSCoordinates(properties);

    CGImageMetadataRef sourceMetadata = CGImageSourceCopyMetadataAtIndex(source, 0, NULL);
    BOOL hasXmp = NO;
    if (sourceMetadata) {
        CFArrayRef tags = CGImageMetadataCopyTags(sourceMetadata);
        hasXmp = tags && CFArrayGetCount(tags) > 0;
        if (tags) CFRelease(tags);
        CFRelease(sourceMetadata);
    }

    NSDictionary *capture = @{
        @"dateTimeOriginal": Nullable(StringProperty(exif, kCGImagePropertyExifDateTimeOriginal)),
        @"dateTimeDigitized": Nullable(StringProperty(exif, kCGImagePropertyExifDateTimeDigitized)),
        @"tiffDateTime": Nullable(StringProperty(tiff, kCGImagePropertyTIFFDateTime)),
        @"offsetTime": Nullable(StringProperty(exif, kCGImagePropertyExifOffsetTime)),
        @"offsetTimeOriginal": Nullable(StringProperty(exif, kCGImagePropertyExifOffsetTimeOriginal)),
        @"offsetTimeDigitized": Nullable(StringProperty(exif, kCGImagePropertyExifOffsetTimeDigitized)),
        @"subsecondTimeOriginal": Nullable(StringProperty(exif, kCGImagePropertyExifSubsecTimeOriginal))
    };

    NSDictionary *thumbnailOptions = @{
        (__bridge NSString *)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
        (__bridge NSString *)kCGImageSourceCreateThumbnailWithTransform: @YES,
        (__bridge NSString *)kCGImageSourceThumbnailMaxPixelSize: @(MAX(16, maximum.integerValue)),
        (__bridge NSString *)kCGImageSourceShouldCacheImmediately: @YES
    };
    CGImageRef thumbnail = CGImageSourceCreateThumbnailAtIndex(
        source,
        0,
        (__bridge CFDictionaryRef)thumbnailOptions
    );
    if (!thumbnail) {
        CFRelease(source);
        return Failure(key, @"ImageIO could not create an orientation-correct thumbnail.");
    }

    CGColorSpaceRef srgb = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGContextRef context = CGBitmapContextCreate(
        NULL,
        CGImageGetWidth(thumbnail),
        CGImageGetHeight(thumbnail),
        8,
        0,
        srgb,
        kCGBitmapByteOrder32Big | kCGImageAlphaPremultipliedLast
    );
    if (!srgb || !context) {
        if (context) CGContextRelease(context);
        if (srgb) CGColorSpaceRelease(srgb);
        CGImageRelease(thumbnail);
        CFRelease(source);
        return Failure(key, @"Core Graphics could not convert the thumbnail to sRGB.");
    }
    CGContextSetInterpolationQuality(context, kCGInterpolationHigh);
    CGContextDrawImage(
        context,
        CGRectMake(0, 0, CGImageGetWidth(thumbnail), CGImageGetHeight(thumbnail)),
        thumbnail
    );
    CGImageRef converted = CGBitmapContextCreateImage(context);
    CGContextRelease(context);
    CGColorSpaceRelease(srgb);
    CGImageRelease(thumbnail);
    if (!converted) {
        CFRelease(source);
        return Failure(key, @"Core Graphics could not finish the sRGB conversion.");
    }

    NSURL *outputUrl = [NSURL fileURLWithPath:outputPath];
    CGImageDestinationRef destination = CGImageDestinationCreateWithURL(
        (__bridge CFURLRef)outputUrl,
        CFSTR("public.jpeg"),
        1,
        NULL
    );
    if (!destination) {
        CGImageRelease(converted);
        CFRelease(source);
        return Failure(key, @"ImageIO could not create the JPEG destination.");
    }
    NSDictionary *destinationProperties = @{
        (__bridge NSString *)kCGImageDestinationLossyCompressionQuality: @(
            MIN(1.0, MAX(0.0, quality.doubleValue))
        ),
        (__bridge NSString *)kCGImagePropertyOrientation: @1,
        (__bridge NSString *)kCGImageMetadataShouldExcludeGPS: @YES,
        (__bridge NSString *)kCGImageMetadataShouldExcludeXMP: @YES
    };
    CGImageDestinationAddImage(
        destination,
        converted,
        (__bridge CFDictionaryRef)destinationProperties
    );
    BOOL finalized = CGImageDestinationFinalize(destination);
    CFRelease(destination);
    if (!finalized) {
        CGImageRelease(converted);
        CFRelease(source);
        return Failure(key, @"ImageIO could not finish writing the JPEG output.");
    }

    NSNumber *outputWidth = @(CGImageGetWidth(converted));
    NSNumber *outputHeight = @(CGImageGetHeight(converted));
    NSString *outputProfile = @"sRGB IEC61966-2.1";
    BOOL outputGps = NO;
    BOOL outputDevice = NO;
    NSMutableArray *outputSensitiveMetadata = [NSMutableArray array];
    CGImageRelease(converted);

    CGImageSourceRef outputSource = CGImageSourceCreateWithURL((__bridge CFURLRef)outputUrl, NULL);
    if (outputSource) {
        NSDictionary *outputProperties =
            CFBridgingRelease(CGImageSourceCopyPropertiesAtIndex(outputSource, 0, NULL));
        if ([outputProperties isKindOfClass:[NSDictionary class]]) {
            outputWidth = IntegerProperty(outputProperties, kCGImagePropertyPixelWidth) ?: outputWidth;
            outputHeight = IntegerProperty(outputProperties, kCGImagePropertyPixelHeight) ?: outputHeight;
            outputProfile =
                StringProperty(outputProperties, kCGImagePropertyProfileName) ?: outputProfile;
            NSDictionary *outputFlags = MetadataFlags(outputProperties);
            outputGps = [outputFlags[@"gps"] boolValue];
            outputDevice = [outputFlags[@"device"] boolValue];
            NSDictionary *sensitiveDictionaries = @{
                @"gps": (__bridge NSString *)kCGImagePropertyGPSDictionary,
                @"iptc": (__bridge NSString *)kCGImagePropertyIPTCDictionary,
                @"apple-maker": (__bridge NSString *)kCGImagePropertyMakerAppleDictionary
            };
            for (NSString *label in sensitiveDictionaries) {
                id dictionary = outputProperties[sensitiveDictionaries[label]];
                if ([dictionary isKindOfClass:[NSDictionary class]] && [dictionary count] > 0) {
                    [outputSensitiveMetadata addObject:label];
                }
            }
            NSDictionary *outputTiff =
                outputProperties[(__bridge NSString *)kCGImagePropertyTIFFDictionary];
            if ([outputTiff isKindOfClass:[NSDictionary class]] && outputTiff.count > 0) {
                NSArray *privateTiffKeys = @[
                    @"DocumentName",
                    @"ImageDescription",
                    @"Make",
                    @"Model",
                    @"Software",
                    @"DateTime",
                    @"Artist",
                    @"HostComputer",
                    @"Copyright"
                ];
                for (NSString *key in privateTiffKeys) {
                    if (outputTiff[key]) {
						[outputSensitiveMetadata addObject:[@"tiff:" stringByAppendingString:key]];
                    }
                }
            }
            NSDictionary *outputExif =
                outputProperties[(__bridge NSString *)kCGImagePropertyExifDictionary];
            if ([outputExif isKindOfClass:[NSDictionary class]] && outputExif.count > 0) {
                NSArray *privateExifKeys = @[
                    @"DateTimeOriginal",
                    @"DateTimeDigitized",
                    @"OffsetTime",
                    @"OffsetTimeOriginal",
                    @"OffsetTimeDigitized",
                    @"SubsecTime",
                    @"SubsecTimeOriginal",
                    @"SubsecTimeDigitized",
                    @"UserComment",
                    @"CameraOwnerName",
                    @"BodySerialNumber",
                    @"LensMake",
                    @"LensModel",
                    @"LensSerialNumber",
                    @"MakerNote",
                    @"ImageUniqueID"
                ];
                for (NSString *key in privateExifKeys) {
                    if (outputExif[key]) {
						[outputSensitiveMetadata addObject:[@"exif:" stringByAppendingString:key]];
                    }
                }
            }
        }
        CFRelease(outputSource);
    }
    NSData *outputData =
        [NSData dataWithContentsOfURL:outputUrl options:NSDataReadingMappedIfSafe error:nil];
    NSArray *xmpMarkers = @[@"http://ns.adobe.com/xap/1.0/", @"<?xpacket"];
    for (NSString *marker in xmpMarkers) {
        NSData *markerData = [marker dataUsingEncoding:NSUTF8StringEncoding];
        if ([outputData rangeOfData:markerData options:0 range:NSMakeRange(0, outputData.length)].location !=
            NSNotFound) {
            [outputSensitiveMetadata addObject:@"xmp-packet"];
            break;
        }
    }

    NSString *formatIdentifier = (__bridge NSString *)CGImageSourceGetType(source);
    NSDictionary *result = @{
        @"key": key,
        @"ok": @YES,
        @"error": [NSNull null],
        @"formatIdentifier": Nullable(formatIdentifier),
        @"imageCount": @(CGImageSourceGetCount(source)),
        @"pixelWidth": Nullable(width),
        @"pixelHeight": Nullable(height),
        @"orientation": Nullable(orientation),
        @"orientedWidth": Nullable(orientedWidth),
        @"orientedHeight": Nullable(orientedHeight),
        @"colorModel": Nullable(StringProperty(properties, kCGImagePropertyColorModel)),
        @"profileName": Nullable(StringProperty(properties, kCGImagePropertyProfileName)),
        @"capture": capture,
        @"gpsPresent": flags[@"gps"],
        @"gpsCoordinates": Nullable(gpsCoordinates),
        @"deviceMetadataPresent": flags[@"device"],
        @"xmpPresent": @(hasXmp),
        @"outputWidth": Nullable(outputWidth),
        @"outputHeight": Nullable(outputHeight),
        @"outputProfileName": Nullable(outputProfile),
        @"outputGpsPresent": @(outputGps),
        @"outputDeviceMetadataPresent": @(outputDevice),
        @"outputSensitiveMetadata": outputSensitiveMetadata
    };
    CFRelease(source);
    return result;
}

int main(void) {
    @autoreleasepool {
        NSData *input = [[NSFileHandle fileHandleWithStandardInput] readDataToEndOfFile];
        NSError *error = nil;
        id value = [NSJSONSerialization JSONObjectWithData:input options:0 error:&error];
        if (![value isKindOfClass:[NSArray class]]) {
            NSString *message = [NSString stringWithFormat:@"Invalid image-tool request: %@\n", error];
            [[NSFileHandle fileHandleWithStandardError] writeData:[message dataUsingEncoding:NSUTF8StringEncoding]];
            return 2;
        }

        NSMutableArray *results = [NSMutableArray array];
        for (id request in (NSArray *)value) {
            if ([request isKindOfClass:[NSDictionary class]]) {
                [results addObject:ProcessImage(request)];
            } else {
                [results addObject:Failure(@"unknown", @"Invalid image request.")];
            }
        }

        NSData *output = [NSJSONSerialization dataWithJSONObject:results options:0 error:&error];
        if (!output) {
            NSString *message =
                [NSString stringWithFormat:@"Could not encode image-tool results: %@\n", error];
            [[NSFileHandle fileHandleWithStandardError] writeData:[message dataUsingEncoding:NSUTF8StringEncoding]];
            return 3;
        }
        [[NSFileHandle fileHandleWithStandardOutput] writeData:output];
        [[NSFileHandle fileHandleWithStandardOutput] writeData:[@"\n" dataUsingEncoding:NSUTF8StringEncoding]];
        return 0;
    }
}
