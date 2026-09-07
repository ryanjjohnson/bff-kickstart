package com.example.bffkickstart.reporting.config;

import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationInitializer;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Map;

/**
 * The "data warehouse" - a second, entirely separate datasource (db.kickstart-rpt.*) backing the
 * read-only daily_reports feature. Deliberately decoupled from the primary transactional
 * datasource (DataSourceConfig): its own HikariDataSource, its own EntityManagerFactory/
 * TransactionManager (Spring Data JPA ties repositories to exactly one EntityManagerFactory, so a
 * second datasource needs its own full JPA stack, not just a second DataSource bean), and its own
 * Flyway migration history via a manually-constructed FlywayMigrationInitializer - Spring Boot's
 * auto-configured Flyway only ever manages one (the @Primary) datasource.
 */
@Configuration
@EnableJpaRepositories(
        basePackages = "com.example.bffkickstart.reporting.repository",
        entityManagerFactoryRef = "kickstartRptEntityManagerFactory",
        transactionManagerRef = "kickstartRptTransactionManager")
public class ReportingDataSourceConfig {

    @Bean
    @ConfigurationProperties("db.kickstart-rpt")
    public HikariDataSource kickstartRptDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class).build();
    }

    @Bean
    @DependsOn("kickstartRptFlywayInitializer")
    public LocalContainerEntityManagerFactoryBean kickstartRptEntityManagerFactory(
            @Qualifier("kickstartRptDataSource") DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean emf = new LocalContainerEntityManagerFactoryBean();
        emf.setDataSource(dataSource);
        emf.setPackagesToScan("com.example.bffkickstart.reporting.domain");
        emf.setPersistenceUnitName("kickstartRpt");
        emf.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        // Deliberately no hibernate.hbm2ddl.auto=validate here (unlike the primary datasource's
        // explicit "none", set directly on its own EntityManagerFactory bean - see
        // DataSourceConfig#entityManagerFactory and application.properties' comment above
        // spring.jpa.open-in-view) - leaving it entirely unset defaults to "none" too,
        // sidestepping the same Oracle-mode DATE-vs-TIMESTAMP validation quirk documented there,
        // for this datasource's own date column.
        emf.setJpaPropertyMap(Map.of("hibernate.format_sql", "true"));
        return emf;
    }

    @Bean
    public PlatformTransactionManager kickstartRptTransactionManager(
            @Qualifier("kickstartRptEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean
    public FlywayMigrationInitializer kickstartRptFlywayInitializer(
            @Qualifier("kickstartRptDataSource") DataSource dataSource) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration-rpt")
                .load();
        return new FlywayMigrationInitializer(flyway);
    }
}
